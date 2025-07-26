import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Abogado } from 'src/entities/abogado.entity';
import { AuthGuard } from 'src/guards/auth.guard';
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
  @UseGuards(AuthGuard)
  async getAllAbogados() {
    return this.abogadoService.getAllAbogados();
  }
  @Post('seederCasos')
  async seedCasosAbogadosyClientes() {
    return this.abogadoService.seedCasosAbogadosyClientes();
  }
  @Get("getByEmail")
 // @UseGuards(AuthGuard)
  async getAbogadoByEmail(@Body("email") email : string) :Promise<Abogado | null>{
    
    
    return this.abogadoService.getAbogadoByEmail(email)
  }
  @Get(':id')
  @UseGuards(AuthGuard)
  async getAbogadoById(@Param('id') id: string) {
    return this.abogadoService.getAbogadoById(id);
  }

}
