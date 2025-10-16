import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { itemTypeController } from "../controllers/itemType.controller";
import { ItemType } from "../entities/itemType.entity";
import { ItemTypeRepository } from "../repositories/itemType.repository";
import { ItemTypeService } from "../services/itemType.service";
import { SectionModule } from "./sectionModule";


@Module({
  imports: [
    TypeOrmModule.forFeature([ItemType]),
    forwardRef(() => SectionModule),
  ],
  controllers: [itemTypeController],
  providers: [ItemTypeService, ItemTypeRepository],
  exports: [ItemTypeService, ItemTypeRepository],
})
export class ItemTypeModule {}