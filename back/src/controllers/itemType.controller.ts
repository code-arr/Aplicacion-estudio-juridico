import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ItemTypeDto } from '../dtos/itemType.dto';
import { ItemTypeService } from '../services/itemType.service';

@Controller('itemType')
export class itemTypeController {
  constructor(private readonly itemTypeService: ItemTypeService) {}

  @Post('create/:sectionId')
  async createItemType(
    @Body() itemType: ItemTypeDto,
    @Param('sectionId') sectionId: string,
  ) {
    return this.itemTypeService.createItemType(itemType, sectionId);
  }

  @Get('getAll')
  async GetAllItemTypes() {
    return this.itemTypeService.getAllItemTypes();
  }
}
