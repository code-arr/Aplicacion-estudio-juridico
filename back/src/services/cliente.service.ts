import { Injectable } from "@nestjs/common";
import { Cliente } from "src/entities/cliente.entity";
import { ClienteRepository } from "src/repositories/cliente.repository";

@Injectable()
export class ClienteService {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async createCliente(clienteData: any): Promise<any> {
    return this.clienteRepository.createCliente(clienteData);
  }


  async seedClientes(): Promise<string> {
    return this.clienteRepository.seedClientes();
  }

  async getAllClientes(): Promise<Cliente[]> {
    return this.clienteRepository.getAllClientes();
  }
  async findByEmail(email: string): Promise<Cliente | null> {
    return this.clienteRepository.findByEmail(email);
  }
}