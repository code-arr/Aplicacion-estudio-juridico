import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from '../entities/meeting.entity';
import { DataSource, Repository } from 'typeorm';
import { ClientItemService } from 'src/services/clientItem.service';
import { ParentTouchService } from 'src/services/parent-touch.service';
@Injectable()
export class MeetingRepository {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly clientItemService: ClientItemService,
    private readonly dataSource: DataSource,
    private readonly parentTouch: ParentTouchService,
  ) {}

  async createMeeting(
    meetingData: Partial<Meeting>,
    clientItemId: string,
    clientId: string,
  ): Promise<Meeting> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const clientItem =
          await this.clientItemService.getClientItemById(clientItemId);
        if (!clientItem) throw new NotFoundException('ClientItem not found');

        const repo = manager.getRepository(Meeting);
        const meeting = repo.create(meetingData);
        meeting.clientItem = clientItem;
        meeting.clientId = clientId;

        const saved = await repo.save(meeting);

        await this.parentTouch.touchClientItem(manager, clientItemId);
        await this.parentTouch.touchClient(manager, clientId);

        return saved;
      } catch (e) {
        console.error('Error creating meeting:', e);
        throw new InternalServerErrorException('Error creating meeting');
      }
    });
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.meetingRepository.find({ relations: ['clientItem'] });
  }

  async updateMeeting(
    id: string,
    meetingData: Partial<Meeting>,
  ): Promise<Meeting | null> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const repo = manager.getRepository(Meeting);

        const current = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });
        if (!current) throw new NotFoundException('Meeting not found');

        const clientItemId = current.clientItem?.id;
        const clientId = current.clientId;

        await repo.update(id, meetingData);
        const updated = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });

        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return updated;
      } catch (e) {
        console.error('Error updating meeting:', e);
        throw new InternalServerErrorException('Error updating meeting');
      }
    });
  }

  async deleteMeeting(id: string): Promise<Meeting> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const repo = manager.getRepository(Meeting);
        const meeting = await repo.findOne({
          where: { id },
          relations: ['clientItem'],
        });
        if (!meeting) throw new NotFoundException('Meeting not found');

        const clientItemId = meeting.clientItem?.id;
        const clientId = meeting.clientId;

        await repo.remove(meeting);

        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return meeting;
      } catch (e) {
        console.error('Error deleting meeting:', e);
        throw new InternalServerErrorException('Error deleting meeting');
      }
    });
  }

  async getByClientItemId(clientItemId: string): Promise<Meeting[]> {
    return this.meetingRepository.find({
      where: { clientItem: { id: clientItemId } },
      relations: ['clientItem'],
    });
  }

  async getByClientId(clientId: string, lawyerId: string): Promise<Meeting[]> {
    return this.meetingRepository.find({
      where: {
        clientItem: { client: { id: clientId }, lawyer: { id: lawyerId } },
      },
    });
  }
}
