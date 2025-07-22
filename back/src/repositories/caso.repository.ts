import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CasoDto } from "src/dtos/caso.dto";
import { Caso } from "src/entities/caso.entity";
import { casosSeedData } from "src/utils/casos";
import { Repository } from "typeorm";

@Injectable()
export class CasoRepository {
  constructor(
    @InjectRepository(Caso) private readonly Casorepository: Repository<Caso>,
  ) {}

  async getAllCasos(): Promise<Caso[]> {
    return this.Casorepository.find({relations: ['abogados', 'clientes']});
  }

  async createCaso(caso: CasoDto): Promise<Caso> {
    return this.Casorepository.save(caso);
  }

  async seedData(): Promise<string> {
    try {
      const casos = casosSeedData;
      for (const caso of casos) {
        const newCaso = await this.createCaso(caso);
        console.log(`Caso creado: ${newCaso.title}`);
      }
      return 'Casos creados correctamente';
    } catch (error) {
      console.error('Error al crear casos:', error);
      throw new Error('Error al crear casos');
    }
  }

  async findOneById(id: string): Promise<Caso | null> {
    return this.Casorepository.findOne({ where: { id } });
  }

  async findOneByTitle(title: string): Promise<Caso | null> {
    return this.Casorepository.findOne({ where: { title } });
  }

  

}