import { Injectable } from "@nestjs/common";
import { AbogadoDto } from "src/dtos/abogado.dto";
import { Lawyer } from "src/entities/lawyer.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";

@Injectable()
export class AbogadoService {
  constructor(private readonly abogadoRepository: AbogadoRepository) {}


  async seedData(): Promise<string> {
    return this.abogadoRepository.seedData();
  }

 async getAllAbogados(): Promise<Lawyer[]> {
    return this.abogadoRepository.getAllAbogados();
  }

  async seedClienteAbogados(): Promise<string> {
    return this.abogadoRepository.seedClientesAbogados();
  }
  async getAbogadoById(id: string): Promise<Lawyer | null> {
    return this.abogadoRepository.getAbogadoById(id);
  }
  async getAbogadoByEmail(email: string): Promise<Lawyer | null> {
    return this.abogadoRepository.getAbogadoByEmail(email);
  }
  async saveAbogado(abogado: Lawyer): Promise<Lawyer> {
    return this.abogadoRepository.saveAbogado(abogado);
  }
}
