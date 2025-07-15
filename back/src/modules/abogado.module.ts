import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbogadoController } from "src/controllers/abogado.controller";
import { Abogado } from "src/entities/abogado.entity";
import { Cliente } from "src/entities/cliente.entity";
import { Usuario } from "src/entities/usuario.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";
import { ClienteRepository } from "src/repositories/cliente.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AbogadoService } from "src/services/abogado.service";
import { ClienteService } from "src/services/cliente.service";
import { UserService } from "src/services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Abogado , Usuario , Cliente])],
  controllers: [AbogadoController],
  providers: [AbogadoService, AbogadoRepository , UserService , UserRepository , ClienteService , ClienteRepository],
  exports: [AbogadoService, AbogadoRepository], 
})
export class AbogadoModule {}
