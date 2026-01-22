import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import { forwardRef, Inject } from '@nestjs/common';
import { UserService } from 'src/services/user.service';
import * as moment from 'moment-timezone';

@Injectable()
export class GoogleCalendarService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /* private async getAccessTokenFromRefreshToken(refreshToken: string) {
    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    try {
      const response = await axios.post(url, params);
      return response.data.access_token;
    } catch (error) {
      console.error('Error al obtener el accessToken con refreshToken:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el accessToken con el refreshToken proporcionado.',
      );
    }
  } */

  private createOAuthClient(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    return oauth2Client;
  }

  // Función para formatear fecha sin la Z (hora local)
  private formatDateToGoogle(date: Date) {
    return date.toISOString().slice(0, 19); // 'YYYY-MM-DDTHH:mm:ss'
  }

  async scheduleMeeting(
    lawyerEmail: string,
    date: Date,
    subject: string,
    participants?: { name?: string; email: string }[], // participantes adicionales opcionales
    timeZone: string = 'America/Santiago', // por defecto Chile
  ) {
    try {
      // 1️⃣ Obtener usuario y refresh token
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refresh token de Google no está configurado para este usuario.',
        );
      }

      /*       // 2️⃣ Obtener access token
      const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );
      if (!accessToken) {
        throw new InternalServerErrorException(
          'No se pudo obtener el token de acceso.',
        );
      } */

      // 3️⃣ Configurar cliente de Google
      /*       const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client }); */
      const oauth2Client = this.createOAuthClient(user.googleRefreshToken);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // 4️⃣ Fechas
      const startDate = new Date(date);
      const startDateCL = moment(date).tz(timeZone);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1h por defecto
      const endDateCL = moment(endDate).tz(timeZone);

      // 5️⃣ Construir lista de asistentes
      const attendees = [
        { email: lawyerEmail },
        ...(participants || []).map((p) => ({
          email: p.email,
          displayName: p.name,
        })),
      ];

      // 6️⃣ Crear evento
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: subject,
          start: {
            dateTime: startDateCL.format('YYYY-MM-DDTHH:mm:ss'),
            timeZone,
          },
          end: { dateTime: endDateCL.format('YYYY-MM-DDTHH:mm:ss'), timeZone },
          attendees,
          conferenceData: {
            createRequest: {
              requestId: `${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          description: [
            `Hora Chile: ${startDateCL.format('ddd D MMM YYYY HH:mm')}–${endDateCL.format('HH:mm')} (${startDateCL.format('z')})`,
            'Tu calendario la mostrará en tu hora local automáticamente.',
          ].join('\n'),
        },
        conferenceDataVersion: 1,
        sendUpdates: 'all', // 🔔 notifica a todos los asistentes
      });

      return res.data;
    } catch (err: any) {
      console.error('Error al agendar la reunión:', err?.message || err);
      throw new InternalServerErrorException('No se pudo agendar la reunión.');
    }
  }

  async updateEvent(
    lawyerEmail: string,
    eventId: string,
    patch: {
      summary?: string;
      startAt?: Date; // nueva fecha/hora inicio
      endAt?: Date; // nueva fecha/hora fin
      timeZone?: string; // ej. 'America/Santiago'
      location?: string;
      attendees?: { name?: string; email: string }[];
    },
  ) {
    try {
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refresh token de Google no está configurado para este usuario.',
        );
      }

      /* const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken }); */

      const oauth2Client = this.createOAuthClient(user.googleRefreshToken);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const timeZone = patch.timeZone ?? 'America/Santiago';
      const requestBody: any = {};

      if (patch.summary !== undefined) requestBody.summary = patch.summary;
      if (patch.location !== undefined) requestBody.location = patch.location;
      if (patch.startAt || patch.endAt) {
        if (patch.startAt) {
          const startCL = moment(patch.startAt)
            .tz(timeZone)
            .format('YYYY-MM-DDTHH:mm:ss');
          requestBody.start = { dateTime: startCL, timeZone };
        }
        if (patch.endAt) {
          const endCL = moment(patch.endAt)
            .tz(timeZone)
            .format('YYYY-MM-DDTHH:mm:ss');
          requestBody.end = { dateTime: endCL, timeZone };
        }
      }
      if (patch.attendees) {
        requestBody.attendees = [
          { email: lawyerEmail },
          ...patch.attendees.map((a) => ({
            email: a.email,
            displayName: a.name,
          })),
        ];
      }

      const res = await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // notifica a todos
      });

      return res.data;
    } catch (err: any) {
      console.error(
        'Error al actualizar evento de Google Calendar:',
        err?.message || err,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar en Google Calendar.',
      );
    }
  }

  async deleteEvent(lawyerEmail: string, eventId: string): Promise<void> {
    try {
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refresh token de Google no está configurado para este usuario.',
        );
      }
      /* const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken }); */

      const oauth2Client = this.createOAuthClient(user.googleRefreshToken);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all', // notifica a asistentes
      });
    } catch (err: any) {
      console.error(
        'Error al eliminar evento de Google Calendar:',
        err?.message || err,
      );
      throw new InternalServerErrorException(
        'No se pudo cancelar en Google Calendar.',
      );
    }
  }
}

