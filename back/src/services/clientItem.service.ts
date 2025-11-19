// src/services/clientItem.service.ts
import { Injectable } from '@nestjs/common';
import { ClientItemDto } from '../dtos/clientItem.dto';
import { ClientItem } from '../entities/clientItem.entity';
import { ClientItemRepository } from '../repositories/clientItem.repository';
import { UpdateClientItemDto } from 'src/dtos/updateClientItem.dto';

@Injectable()
export class ClientItemService {
  constructor(private readonly clientItemRepository: ClientItemRepository) {}

  async createClientItem(
    clientItem: ClientItemDto,
    lawyerId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItem(clientItem, lawyerId);
  }

  async createClientItemGeneric(
    clientItem: ClientItemDto,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItemGeneric(
      clientItem,
      lawyerId,
      clientId,
    );
  }

  async createClientItemCategory(
    clientItem: ClientItemDto,
    categoryId: string,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItemCategory(
      clientItem,
      categoryId,
      lawyerId,
      clientId,
    );
  }

  async getClientItemsByLawyerId(lawyerId: string): Promise<ClientItem[]> {
    return this.clientItemRepository.getByLawyerId(lawyerId);
  }

  async createClientItemInSection(
    clientItem: ClientItemDto,
    sectionId: string,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    return this.clientItemRepository.createClientItemInSection(
      clientItem,
      sectionId,
      lawyerId,
      clientId,
    );
  }

  async getAllClientItems(): Promise<any[]> {
    return await this.clientItemRepository.getAllClientItems();
  }

  async getClientItemById(id: string): Promise<ClientItem> {
    return await this.clientItemRepository.getClientItemById(id);
  }
  async getByClientId(
    clientId: string,
    lawyerId: string,
  ): Promise<ClientItem[]> {
    return this.clientItemRepository.getByClientId(clientId, lawyerId);
  }
  async updateClientItemAccess(
    clientItemId: string,
    accessData: { isPrivate: boolean; sharedLawyerIds: string[] },
  ): Promise<ClientItem> {
    return this.clientItemRepository.updateClientItemAccess(
      clientItemId,
      accessData,
    );
  }
  async updateClientItem(
    clientItemId: string,
    updateData: UpdateClientItemDto,
  ): Promise<ClientItem> {
    return this.clientItemRepository.updateClientItemSimple(
      clientItemId,
      updateData,
    );
  }
}
