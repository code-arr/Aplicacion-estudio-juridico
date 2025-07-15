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
}
