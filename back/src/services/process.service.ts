import { Injectable } from '@nestjs/common';
import { ProcessDto } from '../dtos/process.dto';
import { Process } from '../entities/process.entity';
import { ProcessRepository } from '../repositories/process.repository';

@Injectable()
export class ProcessService {
  constructor(private readonly processRepository: ProcessRepository) {}

  createProcess(
    processDto: ProcessDto,
    clientItemId: string,
    clientId: string,
  ) {
    const payload: Partial<Process> = {
      name: processDto.name,
      description: processDto.description?.trim() || null,
      durationSec: processDto.durationSec ?? 0,
      dateTime: new Date(processDto.dateTime),
      clientId,
    };
    return this.processRepository.createProcess(
      payload,
      clientItemId,
      clientId,
    );
  }

  updateProcess(id: string, processDto: Partial<ProcessDto>) {
    const payload: Partial<Process> = {
      ...(processDto.name !== undefined ? { name: processDto.name } : {}),
      ...(processDto.description !== undefined
        ? { description: processDto.description?.trim() || null }
        : {}),
      ...(processDto.durationSec !== undefined
        ? { durationSec: processDto.durationSec ?? 0 }
        : {}),
      ...(processDto.dateTime
        ? { dateTime: new Date(processDto.dateTime) }
        : {}),
    };

    return this.processRepository.updateProcess(id, payload);
  }

  deleteProcess(id: string) {
    return this.processRepository.deleteProcess(id);
  }

  getProcessById(id: string) {
    return this.processRepository.getProcessById(id);
  }

  getProcessesByClientItemId(clientItemId: string) {
    return this.processRepository.getProcessesByClientItemId(clientItemId);
  }
}
