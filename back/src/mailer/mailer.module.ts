import { MailerModule } from '@nestjs-modules/mailer';
import { forwardRef, Module } from '@nestjs/common';
import { MyMailerService } from './mailer.service';
import { UsersModule } from 'src/modules/users.module';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: process.env.SMTP_SECURE === 'true', // true si usás 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.DEFAULT_EMAIL_FROM, // p.ej: "Ibarra & Asociados" <noreply@...>
      },
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [MyMailerService],
  exports: [MyMailerService, MailerModule], // exporto MailerModule p/ reuso
})
export class MyMailerModule {}
