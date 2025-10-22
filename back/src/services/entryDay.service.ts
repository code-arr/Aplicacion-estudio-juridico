import { Injectable } from '@nestjs/common';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayRepository } from 'src/repositories/entryDay.repository';

type CostSummaryInput = {
  lawyerId: string;
  clientId: string;
  clientItemId?: string;
  year?: number;
  month?: number;
};

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

  async getTop10ByLawyerId(lawyerId: string) {
    return this.repo.getTop10ByLawyerId(lawyerId);
  }

  async getClientDetail(
    lawyerId: string,
    clientId: string,
    clientItemId?: string,
  ) {
    return this.repo.getClientDetail(lawyerId, clientId, clientItemId);
  }
  async getCasesSummary(lawyerId: string, clientId?: string) {
    return this.repo.getCasesSummary(lawyerId, clientId);
  }

  async getCasesExpenses(lawyerId: string, clientId?: string) {
    return this.repo.getCasesExpenses(lawyerId, clientId);
  }

  async getCostSummary(input: CostSummaryInput) {
    return this.repo.getCostSummary(input);
  }

  async getMonthlyTimeByLawyer(lawyerId: string) {
    return this.repo.getMonthlyTimeByLawyer(lawyerId);
  }

  async upsertBulk(
    dtos: CreateTimeEntryDto[],
  ): Promise<EntryDay[] | { inserted: number; updated: number }> {
    console.log(dtos.length);

    if (!dtos.length) return { inserted: 0, updated: 0 };

    const updatedEntryDays = await this.updateEntryDay(dtos);
    return updatedEntryDays;
  }
}
