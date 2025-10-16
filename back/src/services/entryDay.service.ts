import { Injectable } from '@nestjs/common';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayRepository } from 'src/repositories/entryDay.repository';

@Injectable()
export class EntryDayService {
  constructor(private readonly repo: EntryDayRepository) {}

  async createEntryDay(entryDay: Partial<EntryDay>): Promise<EntryDay> {
    return this.repo.createEntryDay(entryDay);
  }

  async updateEntryDay(timeEntry: CreateTimeEntryDto[]): Promise<EntryDay[]> {
    return this.repo.updateEntryDay(timeEntry);
  }
  async getByClientId(lawyerId: string, clientId: string) {
    return this.repo.getByClientId(lawyerId, clientId);
  }
}
