import {
  BadRequestException,
  Catch,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
    lawyerId: string,
  ): Promise<Meeting | null | void> {
    const { startAt, endAt, name, type, participants } = meetingData;

    const startDate = new Date(startAt);
    const endDate = endAt
      ? new Date(endAt)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // +1h por defecto

    if (type === 'google-meet') {
      // 🛠️ PROTECCIÓN DE BACKEND
      // Validamos que venga un email y que parezca de Google (o que sepamos que está auth)
      // Como mínimo, que no esté vacío.
      if (!lawyerEmail) {
        throw new BadRequestException(
          'Para crear una reunión de Google Meet, el abogado debe tener su cuenta de Google vinculada.',
        );
      }

      try {
        // 1️⃣ Crear registro inicial en la base de datos
        const newMeeting = await this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
          clientId,
          lawyerId,
        );

        // 2️⃣ Crear el evento en Google Calendar
        const googleEvent = await this.googleCalendarService.scheduleMeeting(
          lawyerEmail, // organizador
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

        // 6️⃣ Asociar la reunión a otros abogados que figuren como participantes
        if (participants && participants.length > 0) {
          const lawyerParticipants =
            await this.lawyerService.findByEmails(participants);

          for (const participantLawyer of lawyerParticipants) {
            // ⚡ Solo pushear si NO es el organizador
            if (participantLawyer.user.email !== lawyerEmail) {
              participantLawyer.meetings.push(meeting);
              await this.lawyerService.saveAbogado(participantLawyer);
            }
          }
        }

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
        const meeting = await this.meetingRepository.createMeeting(
          { ...meetingData, startAt: startDate, endAt: endDate },
          clientItemId,
          clientId,
          lawyerId,
        );

        // 6️⃣ Asociar la reunión a otros abogados que figuren como participantes
        if (participants && participants.length > 0) {
          const lawyerParticipants =
            await this.lawyerService.findByEmails(participants);

          for (const participantLawyer of lawyerParticipants) {
            // ⚡ Solo pushear si NO es el organizador
            if (participantLawyer.user.email !== lawyerEmail) {
              participantLawyer.meetings.push(meeting);
              await this.lawyerService.saveAbogado(participantLawyer);
            }
          }
        }

        return meeting;
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
    lawyerEmail?: string,
  ): Promise<Meeting | null> {
    // 1) Traer la reunión actual para saber si es Google y su eventId
    const current = await this.meetingRepository.getById(id);
    if (!current) throw new NotFoundException('Meeting not found');

    // 2) Si es Google y hay eventId, preparar patch para Calendar
    const isGoogle = current.type === 'google-meet' && !!current.eventId;

    if (isGoogle) {
      if (!lawyerEmail) {
        throw new BadRequestException(
          'Organizer email (lawyerEmail) is required to update Google events',
        );
      }

      // 3) Armamos patch SOLO con campos que Google entiende
      const gPatch: {
        summary?: string;
        startAt?: Date;
        endAt?: Date;
        timeZone?: string;
        location?: string;
        attendees?: { name?: string; email: string }[];
      } = {};

      if (payload.name !== undefined) gPatch.summary = payload.name;
      if (payload.location !== undefined) gPatch.location = payload.location;
      if (payload.startAt) gPatch.startAt = new Date(payload.startAt);
      if (payload.endAt) gPatch.endAt = new Date(payload.endAt);
      if (payload['timeZone' as any])
        gPatch.timeZone = (payload as any).timeZone;

      if (Array.isArray(payload.participants)) {
        gPatch.attendees = payload.participants.map((p) => ({
          name: p.name,
          email: p.email,
        }));
      }

      // 4) Si hay algo que actualizar, hacemos patch
      if (Object.keys(gPatch).length > 0) {
        if (!lawyerEmail) {
          throw new BadRequestException(
            'Organizer email (lawyerEmail) is required to update Google events',
          );
        }

        await this.googleCalendarService.updateEvent(
          lawyerEmail,
          current.eventId,
          gPatch,
        );
      }
    }

    // 5) Actualizar en BD (incluyendo campos que Google no conoce, ej. notes, status)
    const updated = await this.meetingRepository.updateMeeting(id, payload);
    return updated;
  }

  async deleteMeeting(id: string): Promise<Meeting> {
    return this.meetingRepository.deleteMeeting(id);
  }

  async cancelMeeting(id: string, lawyerEmail: string): Promise<Meeting> {
    // 1) traer meeting actual
    const current = await this.meetingRepository.getById(id);
    if (!current) throw new NotFoundException('Meeting not found');

    // si ya está cancelada, devolvés igual (idempotente)
    if (current.status === 'canceled') return current;

    // 2) si era Google, cancelar en Calendar
    if (current.type === 'google-meet' && current.eventId) {
      if (!lawyerEmail) {
        throw new BadRequestException('Organizer email not found for lawyer');
      }
      // 👍 asumimos que tu servicio tiene un método para borrar el evento
      await this.googleCalendarService.deleteEvent(
        lawyerEmail,
        current.eventId,
      );
    }

    // 3) marcar como cancelada en BD (y opcionalmente limpiar datos)
    const updatedMeeting = await this.meetingRepository.updateMeeting(id, {
      status: 'canceled',
      link: undefined, // opcional
      eventId: undefined, // opcional
    });
    if (!updatedMeeting) {
      throw new NotFoundException('Meeting not found');
    }
    return updatedMeeting;
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

  async updateMeetingNameOrStatus(
    id: string,
    updateData: {
      name?: string;
      status?: 'scheduled' | 'completed' | 'canceled';
    },
  ): Promise<Meeting> {
    return this.meetingRepository.updateMeetingNameOrStatus(id, updateData);
  }

  async getMeetingsByLawyerId(lawyerId: string) {
    return this.meetingRepository.getMeetingsByLawyerId(lawyerId);
  }
}
