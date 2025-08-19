import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbogadoController } from "../controllers/lawyer.controller";
import { Lawyer } from "../entities/lawyer.entity";
import { Client } from "../entities/client.entity";
import { User } from "../entities/user.entity";
import { AbogadoRepository } from "../repositories/lawyer.repository";
import { ClienteRepository } from "../repositories/client.repository";
import { UserRepository } from "../repositories/user.repository";
import { AbogadoService } from "../services/abogado.service";
import { ClienteService } from "../services/cliente.service";
import { UserService } from "../services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Lawyer , User , Client])],
  controllers: [AbogadoController],
  providers: [AbogadoService, AbogadoRepository , UserService , UserRepository , ClienteService , ClienteRepository  ],
  exports: [AbogadoService, AbogadoRepository], 
})
export class AbogadoModule {}
