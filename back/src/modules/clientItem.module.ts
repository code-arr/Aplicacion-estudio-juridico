import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientItem } from "src/entities/clientItem.entity";
import { ItemTypeModule } from "./itemType.module";
import { ClientItemService } from "src/services/clientItem.service";
import { ClientItemController } from "src/controllers/clientItem.controller";
import { ClientItemRepository } from "src/repositories/clientItem.repository";
import { ClienteModule } from "./cliente.module";
import { AbogadoModule } from "./abogado.module";

@Module({
    imports:[TypeOrmModule.forFeature([ClientItem]) , ItemTypeModule , ClienteModule , AbogadoModule],
    controllers:[ClientItemController],
    providers:[ClientItemService , ClientItemRepository ],
    exports:[ClientItemService ,ClientItemRepository ]
})

export class clientItemModule{}