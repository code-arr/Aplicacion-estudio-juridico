import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ItemTypeDto } from "src/dtos/itemType.dto";
import { ItemType } from "src/entities/itemType.entity";
import { SectionService } from "src/services/section.service";
import { Repository } from "typeorm";

@Injectable()
export class ItemTypeRepository { // <-- Nombre de clase corregido
    constructor(
        // <-- ¡Este decorador es crucial!
        @InjectRepository(ItemType)
        private itemRepository: Repository<ItemType>,
        private readonly sectionService: SectionService
    ) {}

    async createItemType(itemType: ItemTypeDto, sectionId: string): Promise<ItemType> {
        // Usa 'await' para esperar el resultado de la promesa
        const section = await this.sectionService.getOneById(sectionId);

        if (!section) {
            throw new NotFoundException("section not found!");
        }

        // Usa 'save' para guardar la entidad en la base de datos
        return await  this.itemRepository.save({
            ...itemType,
            section: section,
        });
    }

    async getAllItemTypes(): Promise<any[]> {
        return this.itemRepository
            .createQueryBuilder("itemType")
            .leftJoin("itemType.section", "section") // <-- Unimos con la relación 'section'
            .select([
                "itemType.id AS id",
                "itemType.name AS name"
            ])
            .addSelect("section.id", "sectionId") // <-- Seleccionamos el id de la sección con un alias
            .getRawMany(); // <-- Obtenemos objetos planos con los alias
    }

}