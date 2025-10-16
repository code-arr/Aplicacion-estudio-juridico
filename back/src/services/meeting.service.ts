import {
  Catch,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MeetingDto } from 'src/dtos/meeting.dto';
import { Meeting } from 'src/entities/meeting.entity';
import { GoogleCalendarService } from 'src/lib/google/calendar';
import { MeetingRepository } from 'src/repositories/meeting.repository';
import { EventService } from './event.service';
import { AbogadoService } from './abogado.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly eventService: EventService,
    private readonly lawyerService: AbogadoService,
  ) {}

  async createAndSchedule(
    meetingData: MeetingDto,
    clientItemId: string,
    lawyerEmail: string,
    to: string,
  ): Promise<Meeting | null | void> {
    const { date, name, meetingType } = meetingData;

    if (meetingType === 'google-meet') {
      try {
        // Solo llama al servicio de calendario

        const meetingDate = new Date(date);
        // Crea el registro en la base de datos con el ID del evento de Google

        const newMeeting = await this.meetingRepository.createMeeting(
          { ...meetingData, startAt: meetingDate },
          clientItemId,
        );

        const googleEvent = await this.googleCalendarService.scheduleMeeting(
          lawyerEmail,
          to,
          meetingDate,
          name,
        );
        const link = googleEvent.htmlLink;
        if (!link) {
          throw new InternalServerErrorException(
            'No se pudo obtener la URL del evento de Google.',
          );
        }
        const meeting = await this.meetingRepository.updateMeeting(
          newMeeting.id,
          { link },
        );

        if (!meeting) {
          throw new InternalServerErrorException(
            'No se pudo actualizar la reunión con la URL de Google Meet.',
          );
        }

        const lawyer = await this.lawyerService.getAbogadoByEmail(lawyerEmail);
        if (!lawyer) {
          throw new InternalServerErrorException(
            'No se pudo obtener el abogado por su correo electrónico.',
          );
        }
        this.eventService.createEvent({
          action: 'CREATE',
          entityName: meeting.name,
          entityId: meeting.id,
          entityType: 'MEETING',
          lawyerId: lawyer.id,
        });
        return meeting;
      } catch (error) {
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en Google Meet.',
        );
      }
    } else if (meetingType === 'in-person') {
      try {
        const meetingDate = new Date(date);
        return this.meetingRepository.createMeeting(
          { ...meetingData, startAt: meetingDate },
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
