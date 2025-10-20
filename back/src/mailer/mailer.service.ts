import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Buffer } from 'buffer';
import { UserService } from '../services/user.service';
import axios from 'axios';
import { getGmailClient, buildMimeMessage } from '../lib/google/gmail.client';
interface MimeOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  filename?: string;
  pdfBuffer?: Buffer;
}

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
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken || !user?.googleEmail) {
        throw new InternalServerErrorException(
          'La cuenta de Google del abogado no está correctamente vinculada.',
        );
      }

      const gmail = getGmailClient(user.googleRefreshToken);

      const raw = buildMimeMessage({
        from: user.googleEmail,
        to,
        subject: `${subject} - ${title}`,
        html: descriptionHtml,
        filename: contractFilename,
        pdfBuffer: contractBuffer,
      });

      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

      return { message: `El documento para ${to} fue enviado con éxito.` };
    } catch (err: any) {
      console.error(
        'Error al enviar el documento (Gmail API):',
        err?.message || err,
      );
      throw new InternalServerErrorException('No se pudo enviar el documento.');
    }
  }
}
