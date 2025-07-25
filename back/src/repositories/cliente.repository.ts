import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common'; // Asegúrate de importar Inject y forwardRef
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClienteDto } from 'src/dtos/cliente';
import { Cliente } from 'src/entities/cliente.entity';
import { AbogadoService } from 'src/services/abogado.service'; // Este es el servicio que causa la circularidad
import { clientesSeedData } from 'src/utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class ClienteRepository {
  constructor(
    @InjectRepository(Cliente) private clienteRepository: Repository<Cliente>,

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

      if (!abogado.clientes) {
        abogado.clientes = [];
      }

      const newCliente = this.clienteRepository.create(clienteData);
      await this.clienteRepository.save(newCliente);

      abogado.clientes.push(newCliente);
      await this.abogadoService.saveAbogado(abogado);
      console.log('abogado.clientes', abogado.clientes);

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
            `[Seed Clientes] Abogado con email '${clienteSeedItem.abogadoAsociadoEmail}' no encontrado para asociar con cliente '${clienteSeedItem.name}'.`,
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

  async getAllClientes(): Promise<Cliente[]> {
    return this.clienteRepository.find({ relations: ['abogados', 'casos'] });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return this.clienteRepository.findOneBy({ email });
  }

  async getClienteById(id: string): Promise<Cliente | null> {
    return this.clienteRepository.findOne({
      where: { id },
      relations: ['abogados', 'casos'],
    });
  }

  // Método para guardar un array de clientes (útil para seeders de relaciones)
  async saveAll(clientes: Cliente[]): Promise<Cliente[]> {
    return this.clienteRepository.save(clientes);
  }
}
