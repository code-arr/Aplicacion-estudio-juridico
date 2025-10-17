// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRepository } from 'src/auth/auth.repository';
import { UserService } from 'src/services/user.service';
import { AuthController } from 'src/auth/auth.controller';
import { UserRepository } from 'src/repositories/user.repository';
import { GoogleModule } from './google.module';
import { SystemMailerModule } from 'src/mailer/system-mailer.module';
import { PasswordResetTokenModule } from 'src/modules/passwordResetToken.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GoogleModule,
    PasswordResetTokenModule,
    SystemMailerModule, // ✅ mails neutrales (reset password)
  ],
  controllers: [AuthController],
  providers: [AuthRepository, UserService, UserRepository],
  exports: [AuthRepository, UserService, UserRepository],
})
export class AuthModule {}
