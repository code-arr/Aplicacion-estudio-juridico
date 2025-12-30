import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Buffer } from 'buffer';
import { UserService } from '../services/user.service';
import { Document } from '../entities/document.entity';
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

interface Attachment {
  filename: string;
  buffer?: Buffer;
  url?: string;
}

@Injectable()
export class MyMailerService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
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

  // 👇 Función helper para descargar archivo desde S3
  private async downloadFromS3(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error descargando archivo de S3:', url, error);
      throw new InternalServerErrorException(
        'No se pudo descargar el archivo de S3',
      );
    }
  }

  // 👇 Función helper para extraer extensión de URL
  private getFileExtension(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1] : 'pdf';
  }

  async sendDocumentEmail(
    lawyerEmail: string,
    to: string,
    subject: string,
    descriptionHtml: string,
    documentIds: string[], // 👈 NUEVO: IDs de docs guardados
    newFile?: Express.Multer.File, // 👈 NUEVO: Archivo nuevo (opcional)
  ) {
    try {
      console.log('📧 [MailerService] Preparando email:', {
        to,
        documentIds,
        hasNewFile: !!newFile,
      });

      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken || !user?.googleEmail) {
        throw new InternalServerErrorException(
          'La cuenta de Google del abogado no está correctamente vinculada.',
        );
      }

      const attachments: Attachment[] = [];

      // 1️⃣ Buscar documentos guardados en la BD
      if (documentIds.length > 0) {
        console.log('📎 [MailerService] Buscando docs guardados:', documentIds);

        const docs = await this.documentRepository.find({
          where: { id: In(documentIds) },
          select: ['id', 'name', 'fileUrl'],
        });

        console.log('📎 [MailerService] Docs encontrados:', docs.length);

        // Descargar cada archivo de S3
        for (const doc of docs) {
          if (doc.fileUrl) {
            try {
              const buffer = await this.downloadFromS3(doc.fileUrl);
              const extension = this.getFileExtension(doc.fileUrl);

              attachments.push({
                filename: `${doc.name}.${extension}`,
                buffer,
              });

              console.log(`✅ [MailerService] Descargado: ${doc.name}`);
            } catch (err) {
              console.error(`❌ [MailerService] Error con ${doc.name}:`, err);
              // Continuar con los demás documentos
            }
          }
        }
      }

      // 2️⃣ Agregar archivo nuevo si existe
      if (newFile) {
        console.log(
          '📎 [MailerService] Agregando archivo nuevo:',
          newFile.originalname,
        );
        attachments.push({
          filename: newFile.originalname,
          buffer: newFile.buffer,
        });
      }

      console.log('📧 [MailerService] Total attachments:', attachments.length);

      const gmail = getGmailClient(user.googleRefreshToken);

      // 3️⃣ Si NO hay attachments, enviar email simple
      if (attachments.length === 0) {
        const raw = this.buildSimpleEmailMessage({
          from: user.googleEmail,
          to,
          subject: subject,
          html: descriptionHtml,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      }
      // 4️⃣ Si es solo un archivo, usar la función original
      else if (attachments.length === 1) {
        const att = attachments[0];

        if (!att.buffer) {
          throw new InternalServerErrorException(
            'Error al procesar el archivo adjunto',
          );
        }

        const raw = buildMimeMessage({
          from: user.googleEmail,
          to,
          subject: subject,
          html: descriptionHtml,
          filename: att.filename,
          pdfBuffer: att.buffer,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      } else {
        // 5️⃣ Si son múltiples archivos
        const raw = this.buildMimeMessageWithMultipleAttachments({
          from: user.googleEmail,
          to,
          subject: subject,
          html: descriptionHtml,
          attachments,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      }

      console.log(`✅ [MailerService] Email enviado exitosamente a ${to}`);
      return {
        message: `El documento para ${to} fue enviado con éxito.`,
        attachmentsCount: attachments.length,
      };
    } catch (err: any) {
      console.error(
        '❌ [MailerService] Error al enviar el documento:',
        err?.message || err,
      );
      throw new InternalServerErrorException('No se pudo enviar el documento.');
    }
  }

  // 👇 NUEVA función para construir MIME con múltiples adjuntos
  private buildMimeMessageWithMultipleAttachments(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: Attachment[];
  }): string {
    const boundary = '----=_Part_' + Date.now();
    const { from, to, subject, html, attachments } = options;

    const mimeMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      html,
      '',
    ];

    // Agregar cada adjunto
    for (const att of attachments) {
      if (att.buffer) {
        mimeMessage.push(
          `--${boundary}`,
          `Content-Type: application/octet-stream; name="${att.filename}"`,
          `Content-Transfer-Encoding: base64`,
          `Content-Disposition: attachment; filename="${att.filename}"`,
          '',
          att.buffer.toString('base64'),
          '',
        );
      }
    }

    mimeMessage.push(`--${boundary}--`);

    const raw = Buffer.from(mimeMessage.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return raw;
  }

  // 👇 NUEVA función para emails simples sin adjuntos
  private buildSimpleEmailMessage(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): string {
    const { from, to, subject, html } = options;

    const mimeMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      html,
    ];

    const raw = Buffer.from(mimeMessage.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return raw;
  }
}

