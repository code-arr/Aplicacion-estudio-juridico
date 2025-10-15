import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { EntryDay } from 'src/entities/entryDay.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EntryDayRepository {
  constructor(
    @InjectRepository(EntryDay)
    private repo: Repository<EntryDay>,
  ) {}

  async createEntryDay(entryDay: Partial<EntryDay>): Promise<EntryDay> {
    const entity = this.repo.create(entryDay);
    return this.repo.save(entity);
  }

  async updateEntryDay(timeEntries: CreateTimeEntryDto[]): Promise<EntryDay[]> {
    const updatedEntryDays: EntryDay[] = [];

    for (const entry of timeEntries) {
      const entryDayDate = entry.dayKey ? new Date(entry.dayKey) : new Date();

      // 🔹 Buscar por trackableId (como hacías antes)
      const existingEntryDay = await this.repo.findOne({
        where: { trackableId: entry.trackableId },
        order: { day: 'DESC' },
      });

      // 🟢 Caso 1: no existe ninguno con ese trackableId → crear nuevo
      if (!existingEntryDay) {
        const newEntryDay = this.repo.create({
          day: entryDayDate,
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
        });
        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);
        console.log('🟢 Se crea un entry day (no existía ninguno)');
        continue;
      }

      // 🟠 Caso 2: existe pero con otro día → crear nuevo
      const existingDay = new Date(existingEntryDay.day);
      if (existingDay.getTime() !== entryDayDate.getTime()) {
        const newEntryDay = this.repo.create({
          day: entryDayDate,
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
        });
        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);
        console.log('🟠 Se crea un nuevo entry day porque cambió el día');
        continue;
      }

      // 🟡 Caso 3: mismo día → actualizar el existente
      existingEntryDay.durationSec += entry.durationSec;
      const saved = await this.repo.save(existingEntryDay);
      updatedEntryDays.push(saved);
      console.log('🟡 Se actualiza el entry day existente');
    }

    return updatedEntryDays;
  }
}
