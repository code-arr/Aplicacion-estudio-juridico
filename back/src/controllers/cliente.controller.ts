import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateClienteDto } from 'src/dtos/cliente';
import { AdminGuard } from 'src/guards/admin.guard';
import { AuthGUard } from 'src/guards/auth.guard';
import { ClienteService } from 'src/services/cliente.service';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @UseGuards(AuthGUard )
  async createCliente(
    @Body() clienteData: CreateClienteDto,
    @Body('abogadoId') abogadoId: string,
  ): Promise<any> {
    return this.clienteService.createCliente(clienteData, abogadoId);
  }

  @Post('seeder')
  async seedClientes(): Promise<string> {
    return this.clienteService.seedClientes();
  }
  @Get(':id')
  @UseGuards(AuthGUard , AdminGuard)
  async getClienteById(@Param('id') id: string) {
    return this.clienteService.getClienteById(id);
  }
  @Get()
  @UseGuards(AuthGUard)
  async getAllClientes() {
    return this.clienteService.getAllClientes();
  }
}
