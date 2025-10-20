// src/auth/google.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from './google.strategy';
import { User } from '../entities/user.entity';
import { UserService } from 'src/services/user.service';
import { UserRepository } from 'src/repositories/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    GoogleStrategy,
    UserService,
    UserRepository,
    // ⛔️ NO pongas AuthRepository acá
  ],
  exports: [
    GoogleStrategy,
    // ⛔️ No exportes AuthRepository
  ],
})
export class GoogleModule {}
