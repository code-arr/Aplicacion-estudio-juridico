import { ClientItemService } from '../services/clientItem.service';
import { ProcessDto } from '../dtos/process.dto';
import { Process } from '../entities/process.entity';
import { DataSource, Repository } from 'typeorm';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayService } from 'src/services/entryDay.service';

@Injectable()
export class ProcessRepository {
  constructor(
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
    private readonly clientItemService: ClientItemService,
    private readonly dataSource: DataSource,
    private readonly parentTouch: ParentTouchService,
    @Inject(forwardRef(() => EntryDayService))
    private readonly entryDayService: EntryDayService,
  ) {}

  async createProcess(
    data: Partial<Process>,
    clientItemId: string,
    clientId: string,
  ): Promise<Process> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const clientItem =
          await this.clientItemService.getClientItemById(clientItemId);
        if (!clientItem) throw new NotFoundException('ClientItem not found');

        const repo = manager.getRepository(Process);
        const proc = repo.create(data);
        proc.clientItem = clientItem;
        proc.clientId = clientId;

        const saved = await repo.save(proc);

        await this.parentTouch.touchClientItem(manager, clientItemId);
        await this.parentTouch.touchClient(manager, clientId);

        return saved;
      } catch (e) {
        console.error('Error creating process:', e);
        throw new InternalServerErrorException('Error creating process');
      }
    });
  }

  async updateProcess(id: string, data: Partial<Process>): Promise<Process> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const repo = manager.getRepository(Process);
        const current = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });
        if (!current) throw new NotFoundException('Process not found');

        const clientItemId = current.clientItem?.id;
        const clientId = current.clientId;

        await repo.update(id, data);
        const updated = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });
        if (!updated)
          throw new InternalServerErrorException('Process not updated');

        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return updated;
      } catch (e) {
        console.error('Error updating process:', e);
        throw new InternalServerErrorException('Error updating process');
      }
    });
  }

  async deleteProcess(id: string): Promise<Process> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const repo = manager.getRepository(Process);
        const proc = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });
        if (!proc) throw new NotFoundException('Process not found');

        const clientItemId = proc.clientItem?.id;
        const clientId = proc.clientId;

        await repo.remove(proc);

        await this.entryDayService.deleteEntryDay(id);

        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return proc;
      } catch (e) {
        console.error('Error deleting process:', e);
        throw new InternalServerErrorException('Error deleting process');
      }
    });
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

  async getAllProcesses(): Promise<Process[]> {
    try {
      const processes = await this.processRepository.find({
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
