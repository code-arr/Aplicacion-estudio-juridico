import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateClienteDto } from "src/dtos/cliente";
import { ClienteService } from "src/services/cliente.service";

@Controller('clientes')
export class ClienteController {
    constructor(private readonly clienteService: ClienteService) {}

    @Post()
    async createCliente(@Body() clienteData: CreateClienteDto , @Body('abogadoId') abogadoId: string): Promise<any> {
        return this.clienteService.createCliente(clienteData , abogadoId);
    }

    @Post('seeder')
    async seedClientes(): Promise<string> {
        return this.clienteService.seedClientes();
    }
    @Get(':id')
    async getClienteById(@Param('id') id: string) {
        return this.clienteService.getClienteById(id);
    }
    @Get()
    async getAllClientes() {
        return this.clienteService.getAllClientes();
    }
}