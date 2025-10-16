import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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

  @Post('/send-document')
  @UseInterceptors(FileInterceptor('contractFile'))
  async sendDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') to: string,
    @Body('subject') subject: string,
    @Body('description') description: string,
    @Body('lawyerEmail') lawyerEmail: string,
    @Body('title') title: string, // <-- Agregamos este parámetro para capturar el título
  ) {
    const contractBuffer = file.buffer;
    const originalFileName = file.originalname;

    return this.myMailerService.sendDocumentEmail(
      lawyerEmail,
      to,
      subject,
      contractBuffer,
      originalFileName,
      description,
      title, // <-- Pasamos el título al servicio
    );
  }

  @Post('create')
  async createClient(@Body() createClientDto: CreateClienteDto, @Query('lawyerId') lawyerId: string): Promise<any> {
    
    return this.clienteService.createClient(createClientDto, lawyerId);
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
