import { Injectable } from "@nestjs/common";
import { Client } from "../entities/client.entity";
import { ClienteRepository } from "../repositories/client.repository";

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

  async getClientsByLawyerId(lawyerId: string): Promise<Client[]> {
    return this.clienteRepository.getClientsByLawyerId(lawyerId);
  }
}