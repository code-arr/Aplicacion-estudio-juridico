import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemTypeDto } from '../dtos/itemType.dto';
import { ItemType } from '../entities/itemType.entity';
import { SectionService } from '../services/section.service';
import { Repository } from 'typeorm';
import {
  ArbitrajesItemTypes,
  ContratosItemTypes,
  DirectoriosItemTypes,
  JuiciosTribunalesItemTypes,
  JuntasAccionistasItemTypes,
  ProcesosPrivadosItemTypes,
  ProcesosPublicosItemTypes,
  SocietyItemTypes,
} from 'src/utils/itemTypes';

@Injectable()
export class ItemTypeRepository implements OnModuleInit {
  // <-- Nombre de clase corregido
  constructor(
    // <-- ¡Este decorador es crucial!
    @InjectRepository(ItemType)
    private itemRepository: Repository<ItemType>,
    private readonly sectionService: SectionService,
  ) {}

  async onModuleInit() {
    await this.seedItemTypes();
  }

  async createItemType(
    itemType: ItemTypeDto,
    sectionId: string,
  ): Promise<ItemType> {
    // Usa 'await' para esperar el resultado de la promesa
    const section = await this.sectionService.getOneById(sectionId);

    if (!section) {
      throw new NotFoundException('section not found!');
    }

    // Usa 'save' para guardar la entidad en la base de datos
    return await this.itemRepository.save({
      ...itemType,
      section: section,
    });
  }

  async getAllItemTypes(): Promise<any[]> {
    return this.itemRepository
      .createQueryBuilder('itemType')
      .leftJoin('itemType.section', 'section') // <-- Unimos con la relación 'section'
      .select(['itemType.id AS id', 'itemType.name AS name'])
      .addSelect('section.id', 'sectionId')
      .addSelect('section.name', 'sectionName') // <-- Seleccionamos el nombre de la sección con un alias
      .getRawMany(); // <-- Obtenemos objetos planos con los alias
  }

  async getItemTypeById(id: string): Promise<ItemType | null> {
    return this.itemRepository.findOne({ where: { id } });
  }

  async seedItemTypes(): Promise<void> {
    const sections = await this.sectionService.getAllSections();
    const itemTypesExists = await this.itemRepository.find();
    const itemTypes = [
      ...SocietyItemTypes,
      ...DirectoriosItemTypes,
      ...JuntasAccionistasItemTypes,
      ...ContratosItemTypes,
      ...JuiciosTribunalesItemTypes,
      ...ArbitrajesItemTypes,
      ...ProcesosPublicosItemTypes,
      ...ProcesosPrivadosItemTypes,
    ];
    if (itemTypesExists.length > 0) {
      return;
    }

    for (const section of sections) {
      if (section.name === 'Sociedad') {
        for (const itemType of SocietyItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Directorios') {
        for (const itemType of DirectoriosItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Juntas accionistas') {
        for (const itemType of JuntasAccionistasItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Juicios tribunales') {
        for (const itemType of JuiciosTribunalesItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Contratos') {
        for (const itemType of ContratosItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Arbitrajes') {
        for (const itemType of ArbitrajesItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Procesos publicos') {
        for (const itemType of ProcesosPublicosItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
      if (section.name === 'Procesos privados') {
        for (const itemType of ProcesosPrivadosItemTypes) {
          await this.createItemType(itemType, section.id);
        }
      }
    }
  }

  async getAllItemTypesSeeder(): Promise<ItemType[]> {
  return this.itemRepository.find({ relations: ['section'] });
}

}
