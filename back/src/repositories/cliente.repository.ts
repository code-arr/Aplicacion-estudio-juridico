import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from 'src/entities/cliente.entity';
import { clientesSeedData } from 'src/utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class ClienteRepository {
  constructor(
    @InjectRepository(Cliente) private clienteRepository: Repository<Cliente>,
  ) {}
  async createCliente(clienteData: any): Promise<any> {
    const cliente = this.clienteRepository.create(clienteData);
    return this.clienteRepository.save(cliente);
  }
  async seedClientes(): Promise<string> {
    const clientes = clientesSeedData;

    for (const cliente of clientes) {
      await this.createCliente(cliente);
    }

    return 'Clientes agregados a la base de datos correctamente.';
  }

  async getAllClientes(): Promise<Cliente[]> {
    return this.clienteRepository.find({ relations: ['abogados'] });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return this.clienteRepository.findOneBy({email})
  }
}
