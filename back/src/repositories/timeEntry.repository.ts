// src/time-entries/time-entries.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryTimeEntriesDto } from 'src/dtos/queryTimeEntry.dto';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { Audience } from 'src/entities/audience.entity';
import { Client } from 'src/entities/client.entity';
import { Document } from 'src/entities/document.entity';
import { EntryDay } from 'src/entities/entryDay.entity';
import { TimeEntry, TrackableType } from 'src/entities/timeEntry.entity';
import { EntryDayService } from 'src/services/entryDay.service';
import { In, Repository } from 'typeorm';

@Injectable()
export class TimeEntriesRepository {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly repo: Repository<TimeEntry>,
    private readonly entryDayService: EntryDayService,
  ) {}

  /** Upsert 1 entrada (idempotente por PK=id). */
  async upsertOne(dto: CreateTimeEntryDto): Promise<TimeEntry> {
    // TypeORM save() hace insert o update si existe PK
    const entity = this.repo.create({
      ...dto,
      startedAtUTC: new Date(dto.startedAtUTC),
      endedAtUTC: new Date(dto.endedAtUTC),
    });
    return this.repo.save(entity);
  }

  /** Upsert en bloque (idempotente por PK=id). */
  async upsertBulk(
    dtos: CreateTimeEntryDto[],
  ): Promise<
    | EntryDay[]
    | { inserted: number; updated: number }
  > {
    console.log(dtos.length);

    if (!dtos.length) return { inserted: 0, updated: 0 };

    const updatedEntryDays = await this.entryDayService.updateEntryDay(dtos);
    return updatedEntryDays;
  }

  async findByQuery(q: QueryTimeEntriesDto): Promise<TimeEntry[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.lawyerId = :lawyerId', { lawyerId: q.lawyerId });

    if (q.fromUTC) {
      qb.andWhere('t.startedAtUTC >= :from', { from: new Date(q.fromUTC) });
    }
    if (q.toUTC) {
      qb.andWhere('t.startedAtUTC < :to', { to: new Date(q.toUTC) });
    }

    return qb.orderBy('t.startedAtUTC', 'ASC').getMany();
  }


  async getAll(): Promise<TimeEntry[]> {
    return this.repo.find();
  }
}
