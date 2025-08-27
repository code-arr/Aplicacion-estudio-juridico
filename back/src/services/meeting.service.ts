import { Catch, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MeetingDto } from 'src/dtos/meeting.dto';
import { Meeting } from 'src/entities/meeting.entity';
import { GoogleCalendarService } from 'src/lib/google/calendar';
import { MeetingRepository } from 'src/repositories/meeting.repository';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  async createAndSchedule(
    meetingData: MeetingDto,
    clientItemId: string,
    lawyerEmail: string,
    to: string,
  ): Promise<Meeting | void> {
    const { date, name, meetingType } = meetingData;

    if (meetingType === 'google-meet') {
      try {
        // Solo llama al servicio de calendario

        const meetingDate = new Date(date);
        // Crea el registro en la base de datos con el ID del evento de Google

        const newMeeting = await this.meetingRepository.createMeeting(
          { ...meetingData, date: meetingDate },
          clientItemId,
        );

        const googleEvent = await this.googleCalendarService.scheduleMeeting(
          lawyerEmail,
          to,
          meetingDate,
          name,
        );
        const url = googleEvent.htmlLink;
        if (!url) {
          throw new InternalServerErrorException(
            'No se pudo obtener la URL del evento de Google.',
          );
        }
        this.meetingRepository.updateMeeting(newMeeting.id, { url });
      } catch (error) {
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en Google Meet.',
        );
      }
    } else if (meetingType === 'in-person') {
      try {
        const meetingDate = new Date(date);
        return this.meetingRepository.createMeeting(
          { ...meetingData, date: meetingDate },
          clientItemId,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en persona.',
        );
      }
    }  
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.meetingRepository.getAllMeetings();
  }
}
