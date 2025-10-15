import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntryDay } from "src/entities/entryDay.entity";
import { EntryDayRepository } from "src/repositories/entryDay.repository";
import { EntryDayService } from "src/services/entryDay.service";

@Module({
    imports: [TypeOrmModule.forFeature([EntryDay])],
    controllers: [],
    providers: [EntryDayService, EntryDayRepository],
    exports: [EntryDayService, EntryDayRepository],
})
export class EntryDayModule {}