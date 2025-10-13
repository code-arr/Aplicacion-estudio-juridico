import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProcessService } from '../services/process.service';
import { ProcessDto } from 'src/dtos/process.dto';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('create/:clientItemId')
  createProcess(
    @Param('clientItemId') clientItemId: string,
    @Body() process: ProcessDto,
  ) {
    return this.processService.createProcess(process, clientItemId);
  }

  @Get('getById/:id')
  getProcess(@Param('id') id: string) {
    return this.processService.getProcessById(id);
  }

  @Get('getByClientItemId/:clientItemId')
  getProcessesByClientItemId(@Param('clientItemId') clientItemId: string) {
    return this.processService.getProcessesByClientItemId(clientItemId);
  }
}
