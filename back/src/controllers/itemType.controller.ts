import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ItemTypeDto } from "src/dtos/itemType.dto";
import { ItemTypeService } from "src/services/itemType.service";

@Controller("itemType")
export class itemTypeController {
    constructor(private readonly itemTypeService : ItemTypeService){}

    @Post("create/:sectionId")
    async createItemType(@Body() itemType :ItemTypeDto , @Param("sectionId") sectionId:string) {
        return this.itemTypeService.createItemType(itemType , sectionId );
    }

    @Get("getAll")
    async GetAllItemTypes() {
        return this.itemTypeService.getAllItemTypes()
    }
}