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
        from: user.googleEmail, // debe ser la misma cuenta del refresh token
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
      console.error(
        'Error al enviar el documento (Gmail API):',
        err?.message || err,
      );
      throw new InternalServerErrorException('No se pudo enviar el documento.');
    }
  }

  async sendResetPasswordEmail(userEmail: string, resetToken: string) {
    try {
      const user = await this.userService.findOneByEmail(userEmail);
      if (!user?.googleRefreshToken) {
        throw new InternalServerErrorException(
          'El refreshToken de Google no está configurado para este usuario.',
        );
      }

      const resetLink = `${process.env.APP_PUBLIC_URL}reset?token=${encodeURIComponent(
        resetToken,
      )}`;

      const scheme = process.env.APP_SCHEME || 'ibarrayasoc';
    const deepLink = `${scheme}://reset?token=${encodeURIComponent(resetToken)}`;

      const gmail = getGmailClient(user.googleRefreshToken);

// Usa tu builder; renombro el método local para evitar confusión con el importado
    const raw = await this.buildHtmlMime({
      from: user.googleEmail,
      to: userEmail,
      subject: 'Restablecer contraseña',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
          <p>Hola,</p>
          <p>Para restablecer tu contraseña, hacé click en el botón:</p>

          <p style="margin:24px 0;">
            <a href="${deepLink}"
               style="background:#0b63ce;color:#fff;text-decoration:none;
                      padding:12px 18px;border-radius:6px;display:inline-block;">
              Restablecer contraseña
            </a>
          </p>

          <p>Si el botón no funciona, probá con este enlace:</p>
          <p><a href="${deepLink}">${deepLink}</a></p>

          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#555;">Si no solicitaste este cambio, ignorá este correo.</p>
        </div>
      `,
    });

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      return { message: `Correo de restablecimiento enviado a ${userEmail}` };
    } catch (err: any) {
      console.error(
        'Error al enviar correo de reset password:',
        err?.message || err,
      );
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de restablecimiento.',
      );
    }
  }

  // src/lib/google/gmail.client.ts

  async buildHtmlMime(options: { from: string; to: string; subject: string; html: string }) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`;
  let mime =
    `From: ${options.from}\r\n` +
    `To: ${options.to}\r\n` +
    `Subject: ${encodedSubject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    options.html;

  return Buffer.from(mime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
}
