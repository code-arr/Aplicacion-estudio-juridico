import { Injectable } from "@nestjs/common";
import { CasoDto } from "src/dtos/caso.dto";
import { Caso } from "src/entities/caso.entity";
import { CasoRepository } from "src/repositories/caso.repository";

@Injectable()
export class CasoService {
    constructor(private readonly casoRepository: CasoRepository) {}

    async createCaso(caso: CasoDto): Promise<Caso> {
        return this.casoRepository.createCaso(caso)
    }

    async getAllCasos(): Promise<Caso[]> {
        return this.casoRepository.getAllCasos();
    }

    async seedData(): Promise<string> {
        return this.casoRepository.seedData();
    }

    async findOneById(id: string): Promise<Caso | null> {
        return this.casoRepository.findOneById(id);
    }

    async findOneByTitle(title: string): Promise<Caso | null> {
        return this.casoRepository.findOneByTitle(title);
    }
}