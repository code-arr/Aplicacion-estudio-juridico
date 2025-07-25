import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGUard } from 'src/guards/auth.guard';
import { AbogadoService } from 'src/services/abogado.service';

@Controller('abogados')
export class AbogadoController {
  constructor(private readonly abogadoService: AbogadoService) {}
  @Post('seeder')
  async seedData() {
    return this.abogadoService.seedData();
  }
  @Post('seederClientes')
  async seedAbogadosClientes() {
    return this.abogadoService.seedClienteAbogados();
  }
  @Get('')
  @UseGuards(AuthGUard)
  async getAllAbogados() {
    return this.abogadoService.getAllAbogados();
  }
  @Post('seederCasos')
  @UseGuards(AuthGUard)
  async seedCasosAbogadosyClientes() {
    return this.abogadoService.seedCasosAbogadosyClientes();
  }
  @Get(':id')
  @UseGuards(AuthGUard)
  async getAbogadoById(@Param('id') id: string) {
    return this.abogadoService.getAbogadoById(id);
  }
}
