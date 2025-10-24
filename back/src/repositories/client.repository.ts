import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common'; // Asegúrate de importar Inject y forwardRef
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClienteDto } from '../dtos/cliente';
import { Client } from '../entities/client.entity';
import { AbogadoService } from '../services/abogado.service'; // Este es el servicio que causa la circularidad
import { clientesSeedData } from '../utils/clientes';
import { DataSource, Repository } from 'typeorm';
import { log } from 'node:console';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { UpdateClienteDto } from 'src/dtos/updateClient.dto';

@Injectable()
export class ClienteRepository {
  constructor(
    @InjectRepository(Client) private clienteRepository: Repository<Client>,

    @Inject(forwardRef(() => AbogadoService))
    private readonly abogadoService: AbogadoService,
    private readonly dataSource: DataSource, // 👈 inyectar
    private readonly parentTouch: ParentTouchService, // 👈 inyectar
  ) {}

  async createCliente(
    clienteData: CreateClienteDto,
    abogadoId?: string,
  ): Promise<any> {
    if (abogadoId) {
      const abogado = await this.abogadoService.getAbogadoById(abogadoId);
      if (!abogado) {
        throw new NotFoundException('Abogado no encontrado');
      }

      if (!abogado.clients) {
        abogado.clients = [];
      }

      const newCliente = this.clienteRepository.create(clienteData);
      await this.clienteRepository.save(newCliente);

      await this.abogadoService.saveAbogado(abogado);

      return newCliente;
    }

    const cliente = this.clienteRepository.create(clienteData);
    return this.clienteRepository.save(cliente);
  }

  async seedClientes(): Promise<string> {
    const clientes = clientesSeedData;

    for (const clienteSeedItem of clientes) {
      let abogadoIdToAssociate: string | undefined;

      if (clienteSeedItem.abogadoAsociadoEmail) {
        const abogado = await this.abogadoService.getAbogadoByEmail(
          clienteSeedItem.abogadoAsociadoEmail,
        );
        if (abogado) {
          abogadoIdToAssociate = abogado.id;
        } else {
          console.warn(
            `[Seed Clientes] Abogado con email '${clienteSeedItem.abogadoAsociadoEmail}' no encontrado para asociar con cliente '${clienteSeedItem.firstName}'.`,
          );
        }
      }

      await this.createCliente(
        clienteSeedItem as CreateClienteDto,
        abogadoIdToAssociate,
      );
    }

    return 'Clientes agregados a la base de datos correctamente.';
  }

  async getAllClientes(): Promise<Client[]> {
    return this.clienteRepository.find({
      relations: [
        'lawyers',
        'clientItems',
        'clientItems.audiences',
        'clientItems.documents',
      ],
    });
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.clienteRepository.findOneBy({ email });
  }

  async getClienteById(id: string): Promise<Client | null> {
    return await this.clienteRepository.findOne({
      where: { id },
      relations: [
        'clientItems',
        'clientItems.audiences',
        'clientItems.documents',
      ],
    });
  }

  // Método para guardar un array de clientes (útil para seeders de relaciones)
  async saveAll(clientes: Client[]): Promise<Client[]> {
    return this.clienteRepository.save(clientes);
  }

  async getClientsByLawyerId(lawyerId: string): Promise<Client[]> {
    return this.clienteRepository.find({
      where: { lawyers: { id: lawyerId } },
    });
  }

  async createClient(
    createClientDto: CreateClienteDto,
    lawyerId: string,
  ): Promise<any> {
    log('Lawyer ID recibido en createClient:', lawyerId); // Depuración

    const lawyer = await this.abogadoService.getAbogadoById(lawyerId);
    console.log('Lawyer found:', lawyer, 'lawyer ID : ', lawyerId); // Depuración

    if (!lawyer) {
      throw new NotFoundException('Abogado no encontrado');
    }
    console.log('Paso el if');

    const client = this.clienteRepository.create(createClientDto);
    client.lawyers = [lawyer];
    return await this.clienteRepository.save(client);
  }

  async updateClient(
    clientId: string,
    updateData: UpdateClienteDto,
  ): Promise<Client> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const clientRepo = manager.getRepository(Client);

        // Buscar cliente
        const client = await clientRepo.findOne({
          where: { id: clientId },
          relations: ['clientItems'],
        });
        if (!client) throw new NotFoundException('Client not found');

        // Actualizar solo los campos recibidos
        Object.assign(client, updateData);

        // Guardar cambios
        const saved = await clientRepo.save(client);

        // TOCAR padres si hay clientItems
        if (client.clientItems?.length) {
          for (const item of client.clientItems) {
            await this.parentTouch.touchClientItem(manager, item.id);
          }
        }

        return saved;
      } catch (error) {
        console.error('Error updating client:', error);
        throw new InternalServerErrorException('Error updating client');
      }
    });
  }
}
