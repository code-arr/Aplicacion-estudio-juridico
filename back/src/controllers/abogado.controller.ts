import { Controller, Get, Post } from '@nestjs/common';
import { AbogadoService } from 'src/services/abogado.service';

@Controller('abogados')
export class AbogadoController {
  constructor(private readonly abogadoService: AbogadoService) {}
  @Post('seeder')
  async seedData() {
    return this.abogadoService.seedData();
  }
  @Post("seederClientes")
  async seedAbogadosClientes() {
    return this.abogadoService.seedClienteAbogados();
  }
  @Get('')
  async getAllAbogados() {
    return this.abogadoService.getAllAbogados();
  }
}
