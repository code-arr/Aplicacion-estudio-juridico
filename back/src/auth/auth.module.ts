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
import { UserLoginsModule } from 'src/userLogins/userLogins.module';
import { Lawyer } from 'src/entities/lawyer.entity';
import { AbogadoModule } from 'src/modules/abogado.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User , Lawyer]),
    GoogleModule,
    PasswordResetTokenModule,
    SystemMailerModule, // ✅ mails neutrales (reset password)
    UserLoginsModule, 
    AbogadoModule// 👈 NUEVO
  ],
  controllers: [AuthController],
  providers: [AuthRepository, UserService, UserRepository],
  exports: [AuthRepository, UserService, UserRepository],
})
export class AuthModule {}
