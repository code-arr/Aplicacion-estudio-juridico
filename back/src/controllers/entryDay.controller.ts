import { Controller, Get } from '@nestjs/common';
import { EntryDayService } from 'src/services/entryDay.service';

@Controller('entry-day')
export class EntryDayController {
  constructor(private readonly service: EntryDayService) {}

  @Get('getByClientId/:clientId')
  async getByClientId(lawyerId: string, clientId: string) {
    return this.service.getByClientId(lawyerId, clientId);
  }
}
