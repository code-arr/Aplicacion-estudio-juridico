import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common'; // Asegúrate de importar Inject y forwardRef
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClienteDto } from '../dtos/cliente';
import { Client } from '../entities/client.entity';
import { AbogadoService } from '../services/abogado.service'; // Este es el servicio que causa la circularidad
import { clientesSeedData } from '../utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class ClienteRepository {
  constructor(
    @InjectRepository(Client) private clienteRepository: Repository<Client>,

    @Inject(forwardRef(() => AbogadoService))
    private readonly abogadoService: AbogadoService,
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
    return this.clienteRepository.find();
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.clienteRepository.findOneBy({ email });
  }

  async getClienteById(id: string): Promise<Client | null> {
    return this.clienteRepository.findOne({
      where: { id },
      relations: ['lawyers'],
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

  async createClient(createClientDto: CreateClienteDto, lawyerId: string): Promise<any> {
    const client = this.clienteRepository.create(createClientDto);
    const lawyer = await this.abogadoService.getAbogadoById(lawyerId);
    if (!lawyer) {
      throw new NotFoundException('Abogado no encontrado');
    }
    client.lawyers = [lawyer];
    return this.clienteRepository.save(client);
  }
}
