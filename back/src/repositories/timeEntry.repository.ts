// src/time-entries/time-entries.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryTimeEntriesDto } from 'src/dtos/queryTimeEntry.dto';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { TimeEntry } from 'src/entities/timeEntry.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class TimeEntriesRepository {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly repo: Repository<TimeEntry>,
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
  ): Promise<{ inserted: number; updated: number }> {
    console.log(dtos.length);
    
    if (!dtos.length) return { inserted: 0, updated: 0 };

    // Opción A (simple y portable): save() de todo el array.
    // TypeORM intentará insert/update según exista el id.
    const entities = dtos.map((d) =>
      this.repo.create({
        ...d,
        startedAtUTC: new Date(d.startedAtUTC),
        endedAtUTC: new Date(d.endedAtUTC),
      }),
    );

    // Para saber cuántos son nuevos vs actualizados, primero consultamos ids existentes
    const ids = dtos.map((d) => d.id);
    const existing = await this.repo.find({
      select: ['id'],
      where: { id: In(ids) },
    });
    const existingSet = new Set(existing.map((e) => e.id));
    const maybeNew = entities.filter((e) => !existingSet.has(e.id));
    const maybeUpdate = entities.filter((e) => existingSet.has(e.id));

    await this.repo.save(entities); // hace el upsert

    return { inserted: maybeNew.length, updated: maybeUpdate.length };

    /* 
    Opción B (Postgres): usar onConflict para un bulk más eficiente:
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(TimeEntry)
      .values(entities)
      .orUpdate(
        ['lawyerId','trackableType','trackableId','startedAtUTC','endedAtUTC','durationSec','pauseReason','appVersion','dayKey','updatedAt'],
        ['id'],
      )
      .execute();
    */
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
