import { MailerModule } from '@nestjs-modules/mailer';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyMailerService } from './mailer.service';
import { UsersModule } from 'src/modules/users.module';
import { Document } from 'src/entities/document.entity'; // 👈 Importar entidad

@Module({
  imports: [
    // 👇 Agregar TypeOrmModule para usar DocumentRepository
    TypeOrmModule.forFeature([Document]),

    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.DEFAULT_EMAIL_FROM,
      },
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [MyMailerService],
  exports: [MyMailerService, MailerModule],
})
export class MyMailerModule {}

