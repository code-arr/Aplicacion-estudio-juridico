import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Lawyer } from '../entities/lawyer.entity';
import { AuthGuard } from '../guards/auth.guard';
import { AbogadoService } from '../services/abogado.service';

@Controller('lawyer')
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
  @Get('getAll')
  //@UseGuards(AuthGuard)
  async getAllLawyers() {
    return this.abogadoService.getAllLawyers();
  }

  @Get('getByEmail/:email')
  // @UseGuards(AuthGuard)
  async getAbogadoByEmail(
    @Param('email') email: string,
  ): Promise<Lawyer | null> {
    const response = this.abogadoService.getAbogadoByEmail(email);
    console.log(response);

    return this.abogadoService.getAbogadoByEmail(email);
  }
  @Get(':id')
  @UseGuards(AuthGuard)
  async getAbogadoById(@Param('id') id: string) {
    return this.abogadoService.getAbogadoById(id);
  }
}
