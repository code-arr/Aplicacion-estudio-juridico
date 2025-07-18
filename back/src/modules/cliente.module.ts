import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClienteController } from "src/controllers/cliente.controller";
import { Abogado } from "src/entities/abogado.entity";
import { Caso } from "src/entities/caso.entity";
import { Cliente } from "src/entities/cliente.entity";
import { Usuario } from "src/entities/usuario.entity";
import { AbogadoRepository } from "src/repositories/abogado.repository";
import { CasoRepository } from "src/repositories/caso.repository";
import { ClienteRepository } from "src/repositories/cliente.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AbogadoService } from "src/services/abogado.service";
import { CasoService } from "src/services/caso.service";
import { ClienteService } from "src/services/cliente.service";
import { UserService } from "src/services/user.service";

@Module({
    imports: [TypeOrmModule.forFeature([Cliente , Abogado , Usuario , Caso])],
    controllers: [ClienteController],
    providers: [ClienteService , ClienteRepository , AbogadoService , AbogadoRepository , UserService , UserRepository , CasoService , CasoRepository],
    exports: [ClienteService , ClienteRepository]
})
export class ClienteModule {}