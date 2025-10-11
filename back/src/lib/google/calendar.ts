import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import { forwardRef, Inject } from '@nestjs/common';
import { UserService } from 'src/services/user.service';

@Injectable()
export class GoogleCalendarService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  private async getAccessTokenFromRefreshToken(refreshToken: string) {
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

      // 2️⃣ Obtener access token
      const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );
      if (!accessToken) {
        throw new InternalServerErrorException(
          'No se pudo obtener el token de acceso.',
        );
      }

      // 3️⃣ Configurar cliente de Google
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // 4️⃣ Fechas
      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1h por defecto

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
          start: { dateTime: startDate.toISOString(), timeZone },
          end: { dateTime: endDate.toISOString(), timeZone },
          attendees,
          conferenceData: {
            createRequest: {
              requestId: `${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
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
}
