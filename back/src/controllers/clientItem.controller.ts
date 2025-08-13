import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientItemDto } from 'src/dtos/clientItem.dto';
import { ItemType } from 'src/entities/itemType.entity';
import { ClientItemService } from 'src/services/clientItem.service';

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

  @Get("getAll")
  async getAllClientItems():Promise<any> {
    return this.ClientItemService.getAllClientItems();
  }
}
