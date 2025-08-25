import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Buffer } from 'buffer';
import { UserService } from '../services/user.service';

@Injectable()
export class MyMailerService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

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
      // 1. Buscamos al usuario en la base de datos
      const user = await this.userService.findOneByEmail(lawyerEmail);

      // 2. Validamos que el usuario exista y tenga la clave de correo
      if (!user) {
        throw new InternalServerErrorException(
          'Usuario remitente no encontrado.'
        );
      }
      if (!user.mailerKey) {
        throw new InternalServerErrorException(
          'La clave de aplicación del usuario no está configurada.'
        );
      }
      
      // 3. Creamos un transportador dinámico para el remitente
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.email,
          pass: user.mailerKey, // <-- Usamos la clave de la base de datos
        },
      });

      // 4. Enviamos el correo con los datos proporcionados
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

      return { message: "EL documento para el cliente " + subject + " - " + to + " ha sido enviado con éxito." };

    } catch (error) {
      console.error('Error al enviar el documento:', error);
      throw new InternalServerErrorException('No se pudo enviar el documento.');
    }
  }
}
