import { Body, Controller, Post } from "@nestjs/common";
import { CasoDto } from "src/dtos/caso.dto";
import { Caso } from "src/entities/caso.entity";
import { CasoService } from "src/services/caso.service";

@Controller('casos')
export class CasoController {
    constructor(private readonly casoService: CasoService) {}

    @Post()
    async createCaso(@Body() caso: CasoDto): Promise<Caso> {
        return this.casoService.createCaso(caso);
    }

    @Post('seeder')
    async seedData(): Promise<string> {
        return this.casoService.seedData();
    }
}
