// src/google-calendar/google-calendar.service.ts

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

  async scheduleMeeting(
    lawyerEmail: string,
    to: string,
    date: Date,
    subject: string,
  ) {
    try {
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refresh token de Google no está configurado para este usuario.',
        );
      }

      const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );

      if (!accessToken) {
        throw new InternalServerErrorException(
          'No se pudo obtener el token de acceso.',
        );
      }

      const calendar = google.calendar({ version: 'v3' });
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const res = await calendar.events.insert({
        auth: oauth2Client,
        calendarId: 'primary',
        requestBody: {
          summary: subject,
          attendees: [{ email: lawyerEmail }, { email: to }],
          start: {
            dateTime: date.toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
          end: {
            // <--- This is what you were missing
            dateTime: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
        },
        sendUpdates: 'all',
      });

      return res.data;
    } catch (err: any) {
      console.error('Error al agendar la reunión:', err?.message || err);
      throw new InternalServerErrorException('No se pudo agendar la reunión.');
    }
  }
}
