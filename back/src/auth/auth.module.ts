// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRepository } from 'src/auth/auth.repository';
import { AuthController } from 'src/auth/auth.controller';
import { GoogleModule } from './google.module';
import { SystemMailerModule } from 'src/mailer/system-mailer.module';
import { PasswordResetTokenModule } from 'src/modules/passwordResetToken.module';
import { UserLoginsModule } from 'src/userLogins/userLogins.module';
import { AbogadoModule } from 'src/modules/abogado.module';
import { AdminModule } from 'src/modules/admin.module';
import { UsersModule } from 'src/modules/users.module'; // 👈 Agregar este import

@Module({
  imports: [
    GoogleModule,
    PasswordResetTokenModule,
    SystemMailerModule,
    UserLoginsModule,
    AbogadoModule, // ✅ Exporta AbogadoRepository
    AdminModule, // ✅ Exporta AdminRepository
    UsersModule, // 👈 AGREGAR - Exporta UserService y UserRepository
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    // 👇 ELIMINAR estos (ya vienen de UsersModule)
    // UserService,
    // UserRepository,
  ],
  exports: [AuthRepository],
})
export class AuthModule {}
