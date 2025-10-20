import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntryDayController } from "src/controllers/entryDay.controller";
import { EntryDay } from "src/entities/entryDay.entity";
import { EntryDayRepository } from "src/repositories/entryDay.repository";
import { EntryDayService } from "src/services/entryDay.service";
import { ClienteModule } from "./cliente.module";
import { Client } from "src/entities/client.entity";

@Module({
    imports: [TypeOrmModule.forFeature([EntryDay, Client]) , ClienteModule],
    controllers: [EntryDayController],
    providers: [EntryDayService, EntryDayRepository],
    exports: [EntryDayService, EntryDayRepository],
})
export class EntryDayModule {}