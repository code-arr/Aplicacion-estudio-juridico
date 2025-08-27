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
import { getGmailClient, buildMimeMessage } from '../lib/google/gmail.client';

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
  descriptionHtml: string,
  title: string,
) {
  try {
    // 0) Buscar usuario y validar refreshToken
    const user = await this.userService.findOneByEmail(lawyerEmail);
    if (!user?.googleRefreshToken) {
      throw new InternalServerErrorException(
        'El refreshToken de Google no está configurado para este usuario.',
      );
    }

    // 1) Crear cliente Gmail
    const gmail = getGmailClient(user.googleRefreshToken);

    // 2) Construir MIME (HTML + PDF)
    const raw = buildMimeMessage({
      from: user.email, // debe ser la misma cuenta del refresh token
      to,
      subject: `${subject} - ${title}`,
      html: descriptionHtml,
      filename: contractFilename,
      pdfBuffer: contractBuffer,
    });

    // 3) Enviar por Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    return { message: `El documento para ${to} fue enviado con éxito.` };
  } catch (err: any) {
    // No loguees secretos. Mostrá mensaje limpio.
    console.error('Error al enviar el documento (Gmail API):', err?.message || err);
    throw new InternalServerErrorException('No se pudo enviar el documento.');
  }
}

}

