import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateClienteDto } from '../dtos/cliente';
import { AdminGuard } from '../guards/admin.guard';
import { AuthGuard } from '../guards/auth.guard';
import { MyMailerService } from '../mailer/mailer.service';
import { ClienteService } from '../services/cliente.service';

@Controller('client')
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly myMailerService: MyMailerService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async createCliente(
    @Body() clienteData: CreateClienteDto,
    @Body('abogadoId') abogadoId: string,
  ): Promise<any> {
    return this.clienteService.createCliente(clienteData, abogadoId);
  }

  @Post('send-document')
  // 'contractFile' debe coincidir con el nombre del campo en el formulario HTML del cliente
  @UseInterceptors(FileInterceptor('contractFile'))
  async sendContract(
    @Body('email') email: string,
    @Body('description') description: string,
    @Body('title') title: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Verificamos que el archivo haya sido subido
    if (!file) {
      return { message: 'No se subió ningún archivo.' };
    }

    // Llamamos al servicio de correo con los datos y el archivo
    await this.myMailerService.sendDocumentEmail(
      email,
      title,
      file.buffer,
      file.originalname,
      description,
    );

    return { message: 'Contrato enviado con éxito.' };
  }
  @Post('seeder')
  async seedClientes(): Promise<string> {
    return this.clienteService.seedClientes();
  }
  @Get('getAll')
  //@UseGuards(AuthGuard)
  async getAllClientes() {
    return this.clienteService.getAllClientes();
  }
  @Get('getByLawyerId/:id')
  async getClientsByLawyerId(@Param('id') lawyerId: string) {
    return this.clienteService.getClientsByLawyerId(lawyerId);
  }
  @Get(':id')
  //@UseGuards(AuthGuard , AdminGuard)
  async getClienteById(@Param('id') id: string) {
    return this.clienteService.getClienteById(id);
  }
}
