import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClienteController } from "src/controllers/cliente.controller";
import { Cliente } from "src/entities/cliente.entity";
import { ClienteRepository } from "src/repositories/cliente.repository";
import { ClienteService } from "src/services/cliente.service";

@Module({
    imports: [TypeOrmModule.forFeature([Cliente])],
    controllers: [ClienteController],
    providers: [ClienteService , ClienteRepository],
    exports: [ClienteService]
})
export class ClienteModule {}