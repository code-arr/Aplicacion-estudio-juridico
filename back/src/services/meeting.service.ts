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
    to: string, // cliente principal
  ): Promise<Meeting | null | void> {
    const { startAt, endAt, name, meetingType, participants } = meetingData;

    const startDate = new Date(startAt);
    const endDate = endAt
      ? new Date(endAt)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // +1h por defecto

    if (meetingType === 'google-meet') {
      try {
        // 1️⃣ Crear registro inicial en la base de datos
        const newMeeting = await this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
        );

        // 2️⃣ Crear el evento en Google Calendar
        const googleEvent = await this.googleCalendarService.scheduleMeeting(
          lawyerEmail, // organizador
          to, // cliente principal
          startDate, // fecha inicio
          name, // título
          participants, // participantes adicionales (opcional)
          'America/Santiago', // zona horaria
        );

        // 3️⃣ Obtener el link del Meet
        const link = googleEvent?.hangoutLink || googleEvent?.htmlLink;
        if (!link) {
          throw new InternalServerErrorException(
            'No se pudo obtener la URL del evento de Google Meet.',
          );
        }

        // 4️⃣ Actualizar la reunión con el link
        const meeting = await this.meetingRepository.updateMeeting(
          newMeeting.id,
          { link },
        );
        if (!meeting) {
          throw new InternalServerErrorException(
            'No se pudo actualizar la reunión con la URL de Google Meet.',
          );
        }

        // 5️⃣ Registrar el evento del sistema (log)
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
        console.error('Error creando reunión en Google Meet:', error);
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en Google Meet.',
        );
      }
    } else if (meetingType === 'in-person') {
      try {
        // Reunión presencial
        return this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
        );
      } catch (error) {
        console.error('Error creando reunión en persona:', error);
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
