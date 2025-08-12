import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MyMailerService } from './mailer.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT, // El '+' convierte el string a número
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.DEFAULT_EMAIL_FROM,
      },
      // Si el contrato es subido como un archivo, no necesitas una plantilla aquí.
      // Puedes eliminar la sección 'template' o dejarla para otros correos.
    }),
  ],
  providers: [MyMailerService],
  exports: [MyMailerService],
})
export class MyMailerModule {}