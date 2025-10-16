import { Module } from '@nestjs/common';
import { GoogleStrategy } from './google.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AuthRepository } from './auth.repository';
import { UserService } from 'src/services/user.service';
import { UserRepository } from 'src/repositories/user.repository';

@Module({
  imports: [
    // Aquí importamos el repositorio de usuarios
    // para que la estrategia y el servicio puedan acceder a la base de datos
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    GoogleStrategy, 
    AuthRepository,
    UserService,
    UserRepository
  ],
  exports: [
    GoogleStrategy, 
    AuthRepository,
    UserService
  ],
})
export class GoogleModule {}