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
    clientId: string,
  ): Promise<Meeting | null | void> {
    const { startAt, endAt, name, type, participants } = meetingData;

    const startDate = new Date(startAt);
    const endDate = endAt
      ? new Date(endAt)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // +1h por defecto

    if (type === 'google-meet') {
      try {
        // 1️⃣ Crear registro inicial en la base de datos
        const newMeeting = await this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
          clientId,
        );

        // 2️⃣ Crear el evento en Google Calendar
        const googleEvent = await this.googleCalendarService.scheduleMeeting(
          lawyerEmail, // organizador
          startDate, // fecha inicio
          name, // título
          participants, // participantes adicionales (opcional)
          'America/Santiago', // zona horaria
        );
        console.log('LELGA ACA 2');

        // 3️⃣ Obtener el link del Meet
        const link = googleEvent?.hangoutLink || googleEvent?.htmlLink;
        if (!link) {
          throw new InternalServerErrorException(
            'No se pudo obtener la URL del evento de Google Meet.',
          );
        }
        const eventId = googleEvent.id;
        if (!eventId) {
          throw new InternalServerErrorException(
            'No se pudo obtener el ID del evento de Google Calendar.',
          );
        }

        // 4️⃣ Actualizar la reunión con el link
        const meeting = await this.meetingRepository.updateMeeting(
          newMeeting.id,
          { link, eventId },
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
    } else if (type === 'in-person') {
      try {
        // Reunión presencial
        return this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
          clientId,
        );
      } catch (error) {
        console.error('Error creando reunión en persona:', error);
        throw new InternalServerErrorException(
          'Falló la creación de la reunión en persona.',
        );
      }
    }
  }

  async updateMeeting(
    id: string,
    payload: Partial<Meeting>,
  ): Promise<Meeting | null> {
    return this.meetingRepository.updateMeeting(id, payload);
  }

  async deleteMeeting(id: string): Promise<Meeting> {
    // Si más adelante querés cancelar el evento en Google Calendar, acá podrías:
    // 1) leer la meeting por id (para obtener eventId y organizer),
    // 2) llamar a googleCalendarService para cancelar,
    // 3) recién ahí repo.deleteMeeting(id).
    return this.meetingRepository.deleteMeeting(id);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.meetingRepository.getAllMeetings();
  }

  async getByClientItemId(clientItemId: string): Promise<Meeting[]> {
    return this.meetingRepository.getByClientItemId(clientItemId);
  }

  async getByClientId(clientId: string, lawyerId: string): Promise<Meeting[]> {
    return this.meetingRepository.getByClientId(clientId, lawyerId);
  }
}
