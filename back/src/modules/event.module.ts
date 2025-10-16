import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "src/entities/events.entity";
import { Lawyer } from "src/entities/lawyer.entity";
import { EventRepository } from "src/repositories/event.repository";
import { EventService } from "src/services/event.service";
import { AbogadoModule } from "./abogado.module";

@Module({
  imports: [TypeOrmModule.forFeature([Event]), forwardRef(() => AbogadoModule) , EventModule],
  controllers: [],
  providers: [EventService, EventRepository],
  exports: [EventService, EventRepository],
})

export class EventModule {}