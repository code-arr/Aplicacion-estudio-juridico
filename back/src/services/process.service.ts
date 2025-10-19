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
    return this.processRepository.createProcess(
      processDto,
      clientItemId,
      clientId,
    );
  }

  updateProcess(id: string, data: Partial<Process>) {
    return this.processRepository.updateProcess(id, data);
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
