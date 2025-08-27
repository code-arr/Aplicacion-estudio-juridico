import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
  ) {
    const { date, name, meetingType } = meetingData;

    if (meetingType === 'google-meet') {
      try {
        // Solo llama al servicio de calendario

        const meetingDate = new Date(date);
        await this.googleCalendarService.scheduleMeeting(
          lawyerEmail,
          to,
          meetingDate,
          name,
        );

        // Crea el registro en la base de datos con el ID del evento de Google

        return this.meetingRepository.createMeeting(
          { ...meetingData, date: meetingDate },
          clientItemId,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en Google Meet.',
        );
      }
    } else if (meetingType === 'in-person') {
      const meetingDate = new Date(date);
      return this.meetingRepository.createMeeting(
        { ...meetingData, date: meetingDate },
        clientItemId,
      );
    }

    throw new InternalServerErrorException('Tipo de reunión no válido.');
  }
}
