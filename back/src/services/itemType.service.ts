import { Injectable } from "@nestjs/common";
import { ItemTypeDto } from "src/dtos/itemType.dto";
import { ItemTypeRepository } from "src/repositories/itemType.repository";

@Injectable()
export class ItemTypeService {
    constructor(private readonly itemTypeRepository : ItemTypeRepository){}

    async createItemType(itemType : ItemTypeDto , sectionId : string){
        return this.itemTypeRepository.createItemType(itemType , sectionId);
    }

    async getAllItemTypes():Promise<ItemTypeDto[]> {
        return this.itemTypeRepository.getAllItemTypes()
    }
} 