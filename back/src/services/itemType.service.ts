import { Injectable } from '@nestjs/common';
import { ItemTypeDto } from '../dtos/itemType.dto';
import { ItemType } from '../entities/itemType.entity';
import { ItemTypeRepository } from '../repositories/itemType.repository';

@Injectable()
export class ItemTypeService {
  constructor(private readonly itemTypeRepository: ItemTypeRepository) {}

  async createItemType(itemType: ItemTypeDto, sectionId: string) {
    return this.itemTypeRepository.createItemType(itemType, sectionId);
  }

  async getAllItemTypes(): Promise<ItemTypeDto[]> {
    return this.itemTypeRepository.getAllItemTypes();
  }
  async getItemTypeById(id: string): Promise<ItemType | null> {
    return this.itemTypeRepository.getItemTypeById(id);
  }

  async getAllItemTypesSeeder(): Promise<ItemType[]> {
    return this.itemTypeRepository.getAllItemTypesSeeder();
  }
}
