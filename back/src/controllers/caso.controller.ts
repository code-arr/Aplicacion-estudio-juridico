import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CasoDto } from 'src/dtos/caso.dto';
import { Caso } from 'src/entities/caso.entity';
import { AuthGUard } from 'src/guards/auth.guard';
import { CasoService } from 'src/services/caso.service';

@Controller('casos')
export class CasoController {
  constructor(private readonly casoService: CasoService) {}

  @Post()
  @UseGuards(AuthGUard)
  async createCaso(@Body() caso: CasoDto): Promise<Caso> {
    return this.casoService.createCaso(caso);
  }

  @Post('seeder')
  @UseGuards(AuthGUard)
  async seedData(): Promise<string> {
    return this.casoService.seedData();
  }

  @Get()
  @UseGuards(AuthGUard)
  async getAllCasos(): Promise<Caso[]> {
    return this.casoService.getAllCasos();
  }
}
