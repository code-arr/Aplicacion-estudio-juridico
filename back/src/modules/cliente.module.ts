import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteController } from '../controllers/client.controller';
import { Lawyer } from '../entities/lawyer.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { AbogadoRepository } from '../repositories/lawyer.repository';
import { ClienteRepository } from '../repositories/client.repository';
import { UserRepository } from '../repositories/user.repository';
import { AbogadoService } from '../services/abogado.service';
import { ClienteService } from '../services/cliente.service';
import { UserService } from '../services/user.service';
import { MyMailerService } from '../mailer/mailer.service';
import { MyMailerModule } from '../mailer/mailer.module';
import { ParentTouchService } from 'src/services/parent-touch.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Lawyer, User]), MyMailerModule],
  controllers: [ClienteController],
  providers: [
    ClienteService,
    ClienteRepository,
    AbogadoService,
    AbogadoRepository,
    UserService,
    UserRepository,
    MyMailerService,
    ParentTouchService,
  ],
  exports: [ClienteService, ClienteRepository],
})
export class ClienteModule {}
