import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteController } from 'src/controllers/client.controller';
import { Lawyer } from 'src/entities/lawyer.entity';
import { Client } from 'src/entities/client.entity';
import { User } from 'src/entities/user.entity';
import { AbogadoRepository } from 'src/repositories/lawyer.repository';
import { ClienteRepository } from 'src/repositories/client.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { AbogadoService } from 'src/services/abogado.service';
import { ClienteService } from 'src/services/cliente.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Lawyer, User])],
  controllers: [ClienteController],
  providers: [
    ClienteService,
    ClienteRepository,
    AbogadoService,
    AbogadoRepository,
    UserService,
    UserRepository
  ],
  exports: [ClienteService, ClienteRepository],
})
export class ClienteModule {}
