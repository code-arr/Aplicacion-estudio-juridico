import { ClientItemService } from '../services/clientItem.service';
import { ProcessDto } from '../dtos/process.dto';
import { Process } from '../entities/process.entity';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProcessRepository {
  constructor(
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
    private readonly clientItemService: ClientItemService,
  ) {}

  async createProcess(
    process: ProcessDto,
    clientItemId: string,
  ): Promise<Process> {
    try {
      const clientItem =
        await this.clientItemService.getClientItemById(clientItemId);

      if (!clientItem) {
        throw new NotFoundException('Client item not found');
      }
      const newProcess = this.processRepository.create({
        ...process,
        clientItem: clientItem,
      });

      return await this.processRepository.save(newProcess);
    } catch (error) {
      console.log(error);

      throw new Error('Error creating process');
    }
  }
  async getProcessById(id: string): Promise<Process> {
    try {
      const process = await this.processRepository.findOne({
        where: { id },
        relations: ['clientItem'],
      });
      if (!process) {
        throw new NotFoundException('Process not found');
      }
      return process;
    } catch (error) {
      console.log(error);

      throw new Error('Error fetching process');
    }
  }

  async getProcessesByClientItemId(clientItemId: string): Promise<Process[]> {
    try {
      const processes = await this.processRepository.find({
        where: { clientItem: { id: clientItemId } },
        relations: ['clientItem'],
        order: { dateTime: 'DESC' },
      });
      return processes;
    } catch (error) {
      console.log(error);

      throw new Error('Error fetching processes');
    }
  }
}
