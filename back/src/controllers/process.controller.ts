import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProcessService } from '../services/process.service';
import { ProcessDto } from 'src/dtos/process.dto';
import { Process } from 'src/entities/process.entity';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('create/:clientItemId')
  createProcess(
    @Param('clientItemId') clientItemId: string,
    @Body() process: ProcessDto,
    @Body('clientId') clientId: string,
  ) {
    return this.processService.createProcess(process, clientItemId, clientId);
  }

  @Put('update/:id')
  update(@Param('id') id: string, @Body() data: Partial<ProcessDto>) {
    return this.processService.updateProcess(id, data);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.processService.deleteProcess(id);
  }

  @Get('getById/:id')
  getProcess(@Param('id') id: string) {
    return this.processService.getProcessById(id);
  }

  @Get('getByClientItemId/:clientItemId')
  getProcessesByClientItemId(@Param('clientItemId') clientItemId: string) {
    return this.processService.getProcessesByClientItemId(clientItemId);
  }
  @Get('getAll')
  getAllProcesses() {
    return this.processService.getAllProcesses();
  }
}
