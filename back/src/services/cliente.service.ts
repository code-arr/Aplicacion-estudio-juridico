import { Injectable } from '@nestjs/common';
import { Client } from '../entities/client.entity';
import { ClienteRepository } from '../repositories/client.repository';
import { UpdateClienteDto } from 'src/dtos/updateClient.dto';

@Injectable()
export class ClienteService {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async createCliente(clienteData: any, abogadoId?: string): Promise<any> {
    return this.clienteRepository.createCliente(clienteData, abogadoId);
  }

  async createClient(createClientDto: any, lawyerId: string): Promise<any> {
    return this.clienteRepository.createClient(createClientDto, lawyerId);
  }
  async seedClientes(): Promise<string> {
    return this.clienteRepository.seedClientes();
  }

  async getAllClientes(): Promise<Client[]> {
    return this.clienteRepository.getAllClientes();
  }
  async findByEmail(email: string): Promise<Client | null> {
    return this.clienteRepository.findByEmail(email);
  }
  async getClienteById(id: string): Promise<Client | null> {
    return this.clienteRepository.getClienteById(id);
  }

  async getClientsByLawyerId(lawyerId: string): Promise<Client[]> {
    return this.clienteRepository.getClientsByLawyerId(lawyerId);
  }

  async updateClient(
    clientId: string,
    updateData: UpdateClienteDto,
    
  ): Promise<Client> {
    return this.clienteRepository.updateClient(clientId, updateData);
  }

  async deleteClient(clientId: string): Promise<string> {
    return this.clienteRepository.deleteClient(clientId);
  }
}
