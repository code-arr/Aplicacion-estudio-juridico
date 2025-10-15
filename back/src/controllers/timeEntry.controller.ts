// src/time-entries/time-entries.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QueryTimeEntriesDto } from 'src/dtos/queryTimeEntry.dto';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { TimeEntry } from 'src/entities/timeEntry.entity';
import { TimeEntriesService } from 'src/services/timeEntry.service';


@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly svc: TimeEntriesService) {}

  /** Upsert simple (uno por vez). Idempotente por id. */
  @Post()
  upsertOne(@Body() dto: CreateTimeEntryDto): Promise<TimeEntry> {
    return this.svc.upsertOne(dto);
  }

  /** Upsert en bloque (idempotente por id). */
  @Post('bulk')
  upsertBulk(@Body() body: { entries: CreateTimeEntryDto[] }) {
    return this.svc.upsertBulk(body.entries || []);
  }

  /** Query por abogado + (dayKey | rango) */
  @Get()
  findByQuery(@Query() q: QueryTimeEntriesDto) {
    return this.svc.findByQuery(q);
  }

  @Get('all')
  getAll() {
    return this.svc.getAll();
  }

  // @Get("getByClientId/:clientId")
  // getByClientId(@Param("clientId") clientId: string , @Query("lawyerId") lawyerId: string ) {
  //   return this.svc.getEntriesByClientId(clientId, lawyerId);
  // }
}