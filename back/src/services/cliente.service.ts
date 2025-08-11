import { Injectable } from "@nestjs/common";
import { Client } from "src/entities/client.entity";
import { ClienteRepository } from "src/repositories/client.repository";

@Injectable()
export class ClienteService {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async createCliente(clienteData: any, abogadoId? : string): Promise<any> {
    return this.clienteRepository.createCliente(clienteData , abogadoId);
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
}