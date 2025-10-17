import { Module } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRepository } from 'src/auth/auth.repository';
import { UserService } from 'src/services/user.service';
import { AuthController } from 'src/auth/auth.controller';
import { UserRepository } from 'src/repositories/user.repository';
import { GoogleModule } from './google.module';
/* import { MyMailerModule } from 'src/mailer/mailer.module'; */
import { SystemMailerModule } from 'src/mailer/system-mailer.module'; // ✅ NUEVO
import { PasswordResetTokenModule } from 'src/modules/passwordResetToken.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GoogleModule,
    PasswordResetTokenModule,
    SystemMailerModule, // ✅ mails “neutrales” del sistema (reset password)
    /* MyMailerModule, */
  ],
  controllers: [AuthController],
  providers: [AuthRepository, UserService, UserRepository],
  exports: [AuthRepository, UserService, UserRepository],
})
export class AuthModule {}
