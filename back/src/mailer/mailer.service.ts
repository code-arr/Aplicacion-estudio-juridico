// back/src/mailer/mailer.service.ts
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

  private async getGoogleSignatureForUser(user: any): Promise<string | null> {
    const TTL_HOURS = 6;

    // 1️⃣ Cache válido
    if (user.googleSignatureHtml && user.googleSignatureFetchedAt) {
      const hoursSince =
        (Date.now() - new Date(user.googleSignatureFetchedAt).getTime()) /
        (1000 * 60 * 60);

      if (hoursSince < TTL_HOURS) {
        return user.googleSignatureHtml;
      }
    }

    // 2️⃣ Ir a Gmail
    try {
      const gmail = getGmailClient(user.googleRefreshToken);

      const sendAsRes = await gmail.users.settings.sendAs.list({
        userId: 'me',
      });

      const primary = sendAsRes.data.sendAs?.find(
        (s) => s.sendAsEmail === user.googleEmail,
      );

      if (!primary?.signature) {
        return null;
      }

      // 3️⃣ Guardar cache
      await this.userService.updateUser(user.id, {
        googleSignatureHtml: primary.signature,
        googleSignatureFetchedAt: new Date(),
      });

      return primary.signature;
    } catch (err) {
      console.error('⚠️ Error obteniendo firma de Gmail:', err);

      // 4️⃣ Fallback: usar última firma si existe
      return user.googleSignatureHtml || null;
    }
  }

  async sendDocumentEmail(
    lawyerEmail: string,
    to: string,
    subject: string,
    descriptionHtml: string,
    documentIds: string[],
    newFile?: Express.Multer.File,
  ) {
    const MAX_EMAIL_BYTES = 24 * 1024 * 1024;

    try {
      const user = await this.userService.findOneByEmail(lawyerEmail);
      if (!user?.googleRefreshToken || !user?.googleEmail) {
        throw new InternalServerErrorException(
          'La cuenta de Google del abogado no está correctamente vinculada.',
        );
      }

      const attachments: Attachment[] = [];
      const downloadLinks: { name: string; url: string }[] = [];

      /* =========================
       DOCUMENTOS GUARDADOS
    ========================= */
      if (documentIds.length > 0) {
        const docs = await this.documentRepository.find({
          where: { id: In(documentIds) },
          relations: ['versions'],
        });

        for (const doc of docs) {
          const currentVersion = doc.versions.find(
            (v) => v.versionNumber === doc.currentVersion,
          );

          if (!currentVersion || !currentVersion.fileUrl) continue;

          if ((currentVersion.size ?? 0) <= MAX_EMAIL_BYTES) {
            const buffer = await this.downloadFromS3(currentVersion.fileUrl);
            attachments.push({
              filename: doc.name,
              buffer,
            });
          } else {
            downloadLinks.push({
              name: doc.name,
              url: currentVersion.fileUrl,
            });
          }
        }
      }

      /* =========================
       ARCHIVO NUEVO
    ========================= */
      if (newFile) {
        if (newFile.size <= MAX_EMAIL_BYTES) {
          attachments.push({
            filename: newFile.originalname,
            buffer: newFile.buffer,
          });
        } else {
          // El archivo nuevo YA fue guardado en S3 cuando se creó el documento
          // Si no tenés todavía el fileUrl acá, este bloque se puede ajustar luego
          downloadLinks.push({
            name: newFile.originalname,
            url: 'Archivo disponible en el sistema',
          });
        }
      }

      /* =========================
       CONSTRUIR HTML FINAL
    ========================= */
      let finalHtml = descriptionHtml;

      // 👇 Agregar firma de Gmail
      const signature = await this.getGoogleSignatureForUser(user);

      if (signature) {
        finalHtml += `
        <br/><br/>
        ${signature}
        `;
      }

      if (downloadLinks.length > 0) {
        finalHtml += `
        <hr />
        <p><strong>📎 Documentos disponibles para descarga</strong></p>
        <ul>
          ${downloadLinks
            .map(
              (l) =>
                `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.name}</a></li>`,
            )
            .join('')}
        </ul>
        <p style="font-size:12px;color:#666;">
          Algunos documentos superan el tamaño permitido para envío por correo electrónico.
        </p>
      `;
      }

      const gmail = getGmailClient(user.googleRefreshToken);

      /* =========================
       ENVÍO
    ========================= */
      if (attachments.length === 0) {
        const raw = this.buildSimpleEmailMessage({
          from: user.googleEmail,
          to,
          subject,
          html: finalHtml,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      } else if (attachments.length === 1) {
        const raw = buildMimeMessage({
          from: user.googleEmail,
          to,
          subject,
          html: finalHtml,
          filename: attachments[0].filename,
          pdfBuffer: attachments[0].buffer!,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      } else {
        const raw = this.buildMimeMessageWithMultipleAttachments({
          from: user.googleEmail,
          to,
          subject,
          html: finalHtml,
          attachments,
        });

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
      }

      return {
        message: 'Email enviado correctamente',
        attachments: attachments.length,
        links: downloadLinks.length,
      };
    } catch (err) {
      console.error('❌ Error enviando email:', err);
      throw new InternalServerErrorException('No se pudo enviar el email');
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

