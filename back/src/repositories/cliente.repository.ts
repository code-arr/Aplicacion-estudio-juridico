import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common'; // Asegúrate de importar Inject y forwardRef
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
    
    // Aplica forwardRef aquí para romper la dependencia circular
    @Inject(forwardRef(() => AbogadoService)) // Envuelve AbogadoService con forwardRef
    private readonly abogadoService: AbogadoService,
  ) {}

  async createCliente(
    clienteData: CreateClienteDto,
    abogadoId?: string, // Este abogadoId viene del controlador o de un seeder
  ): Promise<any> {
    if (abogadoId) {
      const abogado = await this.abogadoService.getAbogadoById(abogadoId); // Aquí usas el servicio de abogado
      if (!abogado) {
        throw new NotFoundException('Abogado no encontrado');
      }

      // Asegúrate de que el array 'clientes' del abogado esté inicializado
      if (!abogado.clientes) {
        abogado.clientes = [];
      }

      // Crea el cliente primero para obtener su instancia completa
      const newCliente = this.clienteRepository.create(clienteData);
      await this.clienteRepository.save(newCliente); // Guarda el cliente para que tenga un ID

      // Asocia el cliente recién creado al abogado
      abogado.clientes.push(newCliente);
      await this.abogadoService.saveAbogado(abogado); // Asegúrate de que AbogadoService tenga un método saveAbogado
      console.log("abogado.clientes",abogado.clientes);
      
      return newCliente; // Retorna el cliente creado
    }
    
    const cliente = this.clienteRepository.create(clienteData);
    return this.clienteRepository.save(cliente);
  }

  async seedClientes(): Promise<string> {
    const clientes = clientesSeedData;

    // Modificamos este bucle para usar abogadoAsociadoEmail del seedData
    for (const clienteSeedItem of clientes) {
      let abogadoIdToAssociate: string | undefined;

      if (clienteSeedItem.abogadoAsociadoEmail) {
        // Asume que AbogadoService tiene un método para buscar por email
        const abogado = await this.abogadoService.getAbogadoByEmail(clienteSeedItem.abogadoAsociadoEmail);
        if (abogado) {
          abogadoIdToAssociate = abogado.id;
        } else {
          console.warn(`[Seed Clientes] Abogado con email '${clienteSeedItem.abogadoAsociadoEmail}' no encontrado para asociar con cliente '${clienteSeedItem.name}'.`);
        }
      }
      
      // Llama a createCliente con el ID del abogado si se encontró
      await this.createCliente(clienteSeedItem as CreateClienteDto, abogadoIdToAssociate);
    }

    return 'Clientes agregados a la base de datos correctamente.';
  }

  async getAllClientes(): Promise<Cliente[]> {
    return this.clienteRepository.find({ relations: ['abogados' , "casos"] });
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
