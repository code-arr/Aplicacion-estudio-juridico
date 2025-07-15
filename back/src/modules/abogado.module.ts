import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbogadoController } from "src/controllers/abogado.controller";
import { Abogado } from "src/entities/abogado.entity";
import { Usuario } from "src/entities/usuario.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AbogadoService } from "src/services/abogado.service";
import { UserService } from "src/services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Abogado , Usuario])],
  controllers: [AbogadoController],
  providers: [AbogadoService, AbogadoRepository , UserService , UserRepository],
  exports: [AbogadoService, AbogadoRepository], 
})
export class AbogadoModule {}
