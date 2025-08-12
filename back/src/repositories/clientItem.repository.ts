import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientItemDto } from 'src/dtos/clientItem.dto';
import { ClientItem } from 'src/entities/clientItem.entity';
import { ClienteService } from 'src/services/cliente.service';
7;
import { ItemTypeService } from 'src/services/itemType.service';
import { Repository } from 'typeorm';

@Injectable()
export class ClientItemRepository {
  constructor(
    @InjectRepository(ClientItem)
    private clientItemRepository: Repository<ClientItem>,
    private readonly itemTypeService: ItemTypeService,
    private readonly clientService: ClienteService,
  ) {}

  async createClientItem(
    clientItem: ClientItemDto,
    itemTypeId: string,
    clientId: string,
  ): Promise<ClientItem> {
    const itemType = await this.itemTypeService.getItemTypeById(itemTypeId);
    const client = await this.clientService.getClienteById(clientId);
    if (!itemType) {
      throw new NotFoundException('itemType no encontrado');
    }

    if (!client) {
      throw new NotFoundException('cliente no encontrado');
    }
    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      itemType: itemType,
      client: client,
    });

    return await this.clientItemRepository.save(newClientItem);
  }

  async getAllClientItems(): Promise<any[]> {
  return this.clientItemRepository
    .createQueryBuilder('clientItem')
    .leftJoin('clientItem.itemType', 'itemType') // Unión para obtener el ID de ItemType
    .leftJoin('clientItem.client', 'client') // <-- Unión para obtener el ID de Client
    .select([
      'clientItem.id AS id',
      'clientItem.title AS title',
      'clientItem.description AS description',
    ])
    .addSelect('itemType.id', 'itemTypeId')
    .addSelect('client.id', 'clientId') // <-- Selección del ID del cliente
    .getRawMany();
}
}
