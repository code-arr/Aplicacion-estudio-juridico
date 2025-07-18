import { Injectable } from "@nestjs/common";
import { AbogadoDto } from "src/dtos/abogado.dto";
import { Abogado } from "src/entities/abogado.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";

@Injectable()
export class AbogadoService {
  constructor(private readonly abogadoRepository: AbogadoRepository) {}


  async seedData(): Promise<string> {
    return this.abogadoRepository.seedData();
  }

 async getAllAbogados(): Promise<Abogado[]> {
    return this.abogadoRepository.getAllAbogados();
  }

  async seedClienteAbogados(): Promise<string> {
    return this.abogadoRepository.seedClientesAbogados();
  }
  async seedCasosAbogadosyClientes(): Promise<string | undefined>{
    return this.abogadoRepository.seedCasosAbogadosyClientes();
  } 
  async getAbogadoById(id: string): Promise<Abogado | null> {
    return this.abogadoRepository.getAbogadoById(id);
  }
  async getAbogadoByEmail(email: string): Promise<Abogado | null> {
    return this.abogadoRepository.getAbogadoByEmail(email);
  }
  async saveAbogado(abogado: Abogado): Promise<Abogado> {
    return this.abogadoRepository.saveAbogado(abogado);
  }
}
