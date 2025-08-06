import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbogadoController } from "src/controllers/abogado.controller";
import { Lawyer } from "src/entities/lawyer.entity";
import { Client } from "src/entities/client.entity";
import { User } from "src/entities/user.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";
import { ClienteRepository } from "src/repositories/cliente.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AbogadoService } from "src/services/abogado.service";
import { ClienteService } from "src/services/cliente.service";
import { UserService } from "src/services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Lawyer , User , Client])],
  controllers: [AbogadoController],
  providers: [AbogadoService, AbogadoRepository , UserService , UserRepository , ClienteService , ClienteRepository  ],
  exports: [AbogadoService, AbogadoRepository], 
})
export class AbogadoModule {}
