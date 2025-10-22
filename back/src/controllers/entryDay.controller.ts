import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { EntryDayService } from 'src/services/entryDay.service';

@Controller('entry-day')
export class EntryDayController {
  constructor(private readonly service: EntryDayService) {}

  @Get('getByClientId/:clientId')
  async getByClientId(lawyerId: string, clientId: string) {
    return this.service.getByClientId(lawyerId, clientId);
  }

  @Get('getTop10ByLawyerId')
  async getTop10ByLawyerId(@Query('lawyerId') lawyerId: string) {
    return this.service.getTop10ByLawyerId(lawyerId);
  }
  @Get('getClientDetail/:clientId')
  async getClientDetail(
    @Param('clientId') clientId: string,
    @Query('lawyerId') lawyerId: string,
    @Query('clientItemId') clientItemId?: string,
  ) {
    return this.service.getClientDetail(lawyerId, clientId, clientItemId);
  }
  @Get('cases/summary')
  getCasesSummary(
    @Query('lawyerId') lawyerId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.getCasesSummary(lawyerId, clientId);
  }

  @Get('cases/expenses')
  getCasesExpenses(
    @Query('lawyerId') lawyerId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.getCasesExpenses(lawyerId, clientId);
  }

  @Get('getMonthlyTimeByLawyerId')
  async getMonthlyTimeByLawyer(@Query('lawyerId') lawyerId: string) {
    return this.service.getMonthlyTimeByLawyer(lawyerId);
  }
  @Post('bulk')
  upsertBulk(@Body() body: { entries: CreateTimeEntryDto[] }) {
    return this.service.upsertBulk(body.entries || []);
  }
}
