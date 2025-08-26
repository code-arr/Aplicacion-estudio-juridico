import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Buffer } from 'buffer';
import { UserService } from '../services/user.service';
import axios from 'axios';

@Injectable()
export class MyMailerService {
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

  async sendDocumentEmail(
    lawyerEmail: string,
    to: string,
    subject: string,
    contractBuffer: Buffer,
    contractFilename: string,
    description: string,
    title: string,
  ) {
    try {
      const user = await this.userService.findOneByEmail(lawyerEmail);
      console.log('User: ', user);

      if (!user || !user.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refreshToken de Google del usuario no está configurado o el usuario no existe.',
        );
      }

      const accessToken = await this.getAccessTokenFromRefreshToken(
        user.googleRefreshToken,
      );
      console.log('Access Token: ', accessToken);

      // ⬅️ Cambios aquí: La configuración de auth
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Usa SSL/TLS
        auth: {
          type: 'OAuth2',
          user: user.email,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: user.googleRefreshToken,
          accessToken: accessToken, // El accessToken que obtuviste
        },
      });
      console.log('Client ID: ', process.env.GOOGLE_CLIENT_ID);
      console.log('Client Secret: ', process.env.GOOGLE_CLIENT_SECRET);
      console.log('Refresh Token: ', user.googleRefreshToken);
      console.log('Access Token: ', accessToken);

      await transporter.sendMail({
        from: user.email,
        to: to,
        subject: `${subject} - ${title}`,
        html: description,
        attachments: [
          {
            filename: contractFilename,
            content: contractBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      return {
        message:
          'EL documento para el cliente ' +
          subject +
          ' - ' +
          to +
          ' ha sido enviado con éxito.',
      };
    } catch (error) {
      console.error('Error al enviar el documento:', error);
      throw new InternalServerErrorException('No se pudo enviar el documento.');
    }
  }
}
