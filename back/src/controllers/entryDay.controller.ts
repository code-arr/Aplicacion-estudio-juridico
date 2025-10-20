import { Controller, Get, Param, Query } from '@nestjs/common';
import { EntryDayService } from 'src/services/entryDay.service';

@Controller('entry-day')
export class EntryDayController {
  constructor(private readonly service: EntryDayService) {}

  @Get('getByClientId/:clientId')
  async getByClientId(lawyerId: string, clientId: string) {
    return this.service.getByClientId(lawyerId, clientId);
  }

  @Get('getTop10ByLawyerId/')
  async getTop10ByLawyerId(@Query('lawyerId') lawyerId: string) {
    return this.service.getTop10ByLawyerId(lawyerId);
  }
  @Get('getClientDetail/:clientId') 
  async getClientDetail(@Param('clientId') clientId: string, @Query('lawyerId') lawyerId: string) {
    return this.service.getClientDetail(lawyerId, clientId);
  }
  @Get('getMonthlyTimeByLawyerId')
  async getMonthlyTimeByLawyer(@Query('lawyerId') lawyerId: string) {
    return this.service.getMonthlyTimeByLawyer(lawyerId);
  }
}
