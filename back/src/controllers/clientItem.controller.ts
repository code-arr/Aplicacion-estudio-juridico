import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ClientItemDto } from '../dtos/clientItem.dto';
import { ItemType } from '../entities/itemType.entity';
import { ClientItemService } from '../services/clientItem.service';

@Controller('clientItem')
export class ClientItemController {
  constructor(private readonly ClientItemService: ClientItemService) {}
  @Post('create')
  async createClientItem(
    @Body() clientItem: ClientItemDto,
    @Query('lawyerId') lawyerId: string,
  ) {
    if (clientItem.itemTypeId) {
      return this.ClientItemService.createClientItem(clientItem, lawyerId);
    } else if (clientItem.sectionId) {
      return this.ClientItemService.createClientItemInSection(
        clientItem,
        clientItem.sectionId,
        lawyerId,
        clientItem.clientId
      );
    } else if (clientItem.categoryId) {
      return this.ClientItemService.createClientItemCategory(
        clientItem,
        clientItem.categoryId,
        lawyerId,
        clientItem.clientId
      );
    }
  }

  @Get('getAll')
  async getAllClientItems(): Promise<any> {
    return this.ClientItemService.getAllClientItems();
  }

  @Get('getById/:id')
  async getClientItemById(@Param('id') id: string): Promise<any> {
    return this.ClientItemService.getClientItemById(id);
  }

  @Get('getByClientId/:clientId')
  async getClientItemsByClientId(
    @Param('clientId') clientId: string,
  ): Promise<any> {
    return this.ClientItemService.getByClientId(clientId);
  }

  @Get('getByLawyerId/:lawyerId')
  async getClientItemsByLawyerId(
    @Param('lawyerId') lawyerId: string,
  ): Promise<any> {
    return this.ClientItemService.getClientItemsByLawyerId(lawyerId);
  }
}
