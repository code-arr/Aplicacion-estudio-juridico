import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { itemTypeController } from "src/controllers/itemType.controller";
import { ItemType } from "src/entities/itemType.entity";
import { ItemTypeRepository } from "src/repositories/itemType.repository";
import { ItemTypeService } from "src/services/itemType.service";
import { SectionModule } from "./sectionModule";


@Module({
  imports: [
    TypeOrmModule.forFeature([ItemType]),
    SectionModule, // <-- Añade esta línea para que SectionModule pueda usar CategoryService
  ],
  controllers: [itemTypeController],
  providers: [ItemTypeService, ItemTypeRepository],
  exports: [ItemTypeService, ItemTypeRepository],
})
export class ItemTypeModule {}
