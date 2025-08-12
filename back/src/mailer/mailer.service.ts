import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Buffer } from 'buffer'; // Importamos el tipo Buffer de Node.js

@Injectable()
export class MyMailerService {
  constructor(private readonly mailerService: MailerService) {}

  async sendDocumentEmail(to: string, subject: string, contractBuffer: Buffer, contractFilename: string , description : string) {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: subject,
        html: description,
        attachments: [
          {
            filename: contractFilename,
            content: contractBuffer, // Adjuntamos el archivo usando su buffer
            contentType: 'application/pdf', // Asegúrate de que el tipo de contenido sea el correcto
          },
        ],
      });
    } catch (error) {
      console.error('Error al enviar el contrato:', error);
      throw new InternalServerErrorException('No se pudo enviar el contrato.');
    }
  }
}