import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async getAllMeetings(): Promise<Meeting[]> {
    return this.meetingRepository.find({ relations: ['clientItem'] });
  }

  async updateMeeting(
    id: string,
    meetingData: Partial<Meeting>,
  ): Promise<Meeting | null> {
    try {
      const updated = await this.meetingRepository.update(id, meetingData);
      if (!updated) {
        throw new InternalServerErrorException(
          'No se pudo actualizar la reunión.',
        );
      }
      return this.meetingRepository.findOne({
        where: { id },
        relations: ['clientItem'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar la reunión.');
    }
  }

  async getByClientItemId(clientItemId: string): Promise<Meeting[]> {
    return this.meetingRepository.find({
      where: { clientItem: { id: clientItemId } },
      relations: ['clientItem'],
    });
  }

  async getByClientId(clientId: string , lawyerId: string): Promise<Meeting[]> {
    return this.meetingRepository.find({
      where: { clientItem: { client: { id: clientId } ,  lawyer: { id: lawyerId } } },
    });
  }
}
