import { Injectable } from "@nestjs/common";
import { QueryTimeEntriesDto } from "src/dtos/queryTimeEntry.dto";
import { CreateTimeEntryDto } from "src/dtos/timeEntry.dto";
import { EntryDay } from "src/entities/entryDay.entity";
import { TimeEntry } from "src/entities/timeEntry.entity";
import { TimeEntriesRepository } from "src/repositories/timeEntry.repository";

@Injectable()
export class TimeEntriesService {
  constructor(private readonly repo: TimeEntriesRepository) {}

  async upsertOne(dto: CreateTimeEntryDto): Promise<TimeEntry> {
    return this.repo.upsertOne(dto);
  }

  async upsertBulk(dtos: CreateTimeEntryDto[]): Promise<EntryDay[] | { inserted: number; updated: number }> {
    return this.repo.upsertBulk(dtos);
  }

  async findByQuery(q: QueryTimeEntriesDto): Promise<TimeEntry[]> {
    return this.repo.findByQuery(q);
  }

  async getAll(): Promise<TimeEntry[]> {
    return this.repo.getAll();
  }

  // async getEntriesByClientId(clientId: string, lawyerId: string): Promise<TimeEntry[]> {
  //   return this.repo.getEntriesByClientId(clientId, lawyerId);
  // }
}
