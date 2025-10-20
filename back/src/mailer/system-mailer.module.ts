/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SystemMailerService } from './system-mailer.service';
import { MyMailerModule } from './mailer.module'; // reutiliza SMTP ya configurado

@Module({
  imports: [MyMailerModule],
  providers: [SystemMailerService],
  exports: [SystemMailerService],
})
export class SystemMailerModule {}
