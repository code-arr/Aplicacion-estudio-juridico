import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CasoController } from "src/controllers/caso.controller";
import { Caso } from "src/entities/caso.entity";
import { CasoRepository } from "src/repositories/caso.repository";
import { CasoService } from "src/services/caso.service";

@Module({
    imports: [TypeOrmModule.forFeature([Caso])],
    controllers: [CasoController],
    providers: [CasoService , CasoRepository],
    exports: [CasoService , CasoRepository],
})
export class CasoModule {}