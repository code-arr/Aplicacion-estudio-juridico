import { Injectable } from '@nestjs/common';
import { ProcessDto } from '../dtos/process.dto';
import { Process } from '../entities/process.entity';
import { ProcessRepository } from '../repositories/process.repository';

@Injectable()
export class ProcessService {
  constructor(private readonly processRepository: ProcessRepository) {}

  async createProcess(
    processDto: ProcessDto,
    clientItemId: string,
    clientId: string,
  ): Promise<Process> {
    const payload: Partial<Process> = {
      ...processDto,
      // El front ya manda ISO UTC (localDateTimeToIsoUtc), así que esto es seguro
      dateTime: new Date(processDto.dateTime),
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

    return this.processRepo.updateProcess(id, payload);
  }

  deleteProcess(id: string) {
    return this.processRepository.deleteProcess(id);
  }

  async getProcessById(id: string): Promise<Process> {
    return this.processRepository.getProcessById(id);
  }

  async getProcessesByClientItemId(clientItemId: string): Promise<Process[]> {
    return this.processRepository.getProcessesByClientItemId(clientItemId);
  }
}
