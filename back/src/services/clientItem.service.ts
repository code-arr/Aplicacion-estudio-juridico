import { Injectable } from '@nestjs/common';
import { ClientItemDto } from '../dtos/clientItem.dto';
import { ClientItem } from '../entities/clientItem.entity';
import { ClientItemRepository } from '../repositories/clientItem.repository';

@Injectable()
export class ClientItemService {
  constructor(private readonly clientItemRepository: ClientItemRepository) {}

  async createClientItem(
    clientItem: ClientItemDto,
    itemTypeId: string,
    clientId: string,
    lawyerId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItem(
      clientItem,
      itemTypeId,
      clientId,
      lawyerId,
    );
  }

  async createClientItemCategory(
    clientItem: ClientItemDto,
    categoryId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItemCategory(
      clientItem,
      categoryId,
    );
  }

  async createClientItemInSection(
    clientItem: ClientItemDto,
    sectionId: string
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItemInSection(
      clientItem,
      sectionId
    );
  }

  async getAllClientItems(): Promise<any[]> {
    return await this.clientItemRepository.getAllClientItems();
  }

  async getClientItemById(id: string): Promise<ClientItem> {
    return await this.clientItemRepository.getClientItemById(id);
  }
}
