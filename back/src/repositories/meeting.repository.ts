import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from '../entities/meeting.entity';
import { Repository } from 'typeorm';
import { ClientItemService } from 'src/services/clientItem.service';
@Injectable()
export class MeetingRepository {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly clientItem: ClientItemService,
  ) {}

  async createMeeting(
    meetingData: Partial<Meeting>,
    clientItemId: string,
  ): Promise<Meeting> {
    const meeting = this.meetingRepository.create(meetingData);
    meeting.clientItem = await this.clientItem.getClientItemById(clientItemId);
    return this.meetingRepository.save(meeting);
  }
}
