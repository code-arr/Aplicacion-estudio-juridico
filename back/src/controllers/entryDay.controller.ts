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

  @Get('getCostSummary')
  async getCostSummary(
    @Query('lawyerId') lawyerId: string,
    @Query('clientId') clientId: string,
    @Query('clientItemId') clientItemId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string, // 1..12
  ) {
    return this.service.getCostSummary({
      lawyerId,
      clientId,
      clientItemId,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
  }

  // 1) ciclo del caso (tiempo calendario + horas)
  @Get('case-cycle')
  async statsCaseCycle(@Query('clientItemId') clientItemId: string) {
    return this.service.statsCaseCycle(clientItemId);
  }

  // 2) costo estimado del caso (horas * tarifa del cliente)
  @Get('case-cost')
  async statsCaseCost(@Query('clientItemId') clientItemId: string) {
    return this.service.statsCaseCost(clientItemId);
  }

  // 3) promedios por cliente (horas/costo; opcionales year, closedOnly)
  @Get('client-averages')
  async statsClientAverages(
    @Query('clientId') clientId: string,
    @Query('year') year?: string,
    @Query('closedOnly') closedOnly?: string,
  ) {
    return this.service.statsClientAverages(
      clientId,
      year ? +year : undefined,
      closedOnly === 'true',
    );
  }

  // 4) promedios del estudio (o por abogado) en el año
  @Get('study-averages')
  async statsStudyAverages(
    @Query('year') year?: string,
    @Query('lawyerId') lawyerId?: string,
  ) {
    return this.service.statsStudyAverages(year ? +year : undefined, lawyerId);
  }

  // 5) áreas de práctica por cliente (category/section/itemType)
  @Get('practice-areas')
  async statsPracticeAreas(
    @Query('clientId') clientId: string,
    @Query('level') level: 'category' | 'section' | 'itemType' = 'itemType',
    @Query('includeHours') includeHours?: string,
    @Query('includeCost') includeCost?: string,
    @Query('year') year?: string,
  ) {
    return this.service.statsPracticeAreas(
      clientId,
      level,
      includeHours === 'true',
      includeCost === 'true',
      year ? +year : undefined,
    );
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
