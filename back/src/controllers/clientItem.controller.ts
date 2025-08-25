import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientItemDto } from '../dtos/clientItem.dto';
import { ItemType } from '../entities/itemType.entity';
import { ClientItemService } from '../services/clientItem.service';

@Controller("clientItem")
export class ClientItemController {
  constructor(private readonly ClientItemService: ClientItemService) {}
  @Post("create/:itemTypeId")
  async createClientItem(
    @Body() clientItem: ClientItemDto,
    @Param('itemTypeId') itemTypeId: string,
    @Body("clientId") clientId : string,
    @Body("lawyerId") lawyerId : string
    
  ) {
    return this.ClientItemService.createClientItem(clientItem, itemTypeId , clientId , lawyerId);
  }

  @Post("createInCategory/:categoryId")
  async createInCategory(
    @Body() clientItem: ClientItemDto,
    @Param('categoryId') categoryId: string
  ) {
    return this.ClientItemService.createClientItemCategory(clientItem, categoryId);
  }
  @Post("createInSection/:sectionId")
  async createInSection(
    @Body() clientItem: ClientItemDto,
    @Param('sectionId') sectionId: string
  ) {
    return this.ClientItemService.createClientItemInSection(clientItem, sectionId);
  }

  @Get("getAll")
  async getAllClientItems():Promise<any> {
    return this.ClientItemService.getAllClientItems();
  }

  @Get("getById/:id")
  async getClientItemById(@Param('id') id: string): Promise<any> {
    return this.ClientItemService.getClientItemById(id);
  }
}
