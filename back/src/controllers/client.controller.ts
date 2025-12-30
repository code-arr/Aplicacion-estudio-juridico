import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateClienteDto } from '../dtos/cliente';
import { AdminGuard } from '../guards/admin.guard';
import { MyMailerService } from '../mailer/mailer.service';
import { ClienteService } from '../services/cliente.service';

@Controller('client')
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly myMailerService: MyMailerService,
  ) {}

  @Post()
  async createCliente(
    @Body() clienteData: CreateClienteDto,
    @Body('abogadoId') abogadoId: string,
  ): Promise<any> {
    return this.clienteService.createCliente(clienteData, abogadoId);
  }

  @Post('/sendDocument')
  @UseInterceptors(
    FileInterceptor('contractFile', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async sendDocument(
    @UploadedFile() file: Express.Multer.File | undefined, // 👈 CAMBIO 1: Opcional
    @Body('email') to: string,
    @Body('subject') subject: string,
    @Body('description') description: string,
    @Body('documentIds') documentIds: string, // 👈 CAMBIO 2: Nuevo campo (JSON string)
    @Query('lawyerEmail') lawyerEmail: string,
  ) {
    console.log('📧 [Controller] sendDocument llamado:', {
      to,
      subject,
      hasFile: !!file,
      documentIds: documentIds || 'null',
    });

    // 👇 CAMBIO 3: Parsear IDs de documentos guardados
    const docIds: string[] = documentIds ? JSON.parse(documentIds) : [];

    // 👇 CAMBIO 4: Validar que venga al menos algo
    /*  if (docIds.length === 0 && !file) {
      throw new BadRequestException(
        'Debe enviar al menos un documento guardado o un archivo nuevo',
      );
    } */

    // 👇 CAMBIO 5: Pasar ambos parámetros al servicio
    return this.myMailerService.sendDocumentEmail(
      lawyerEmail,
      to,
      subject,
      description,
      docIds, // IDs de docs guardados
      file, // archivo nuevo (puede ser undefined)
    );
  }

  @Post('create')
  async createClient(
    @Body() createClientDto: CreateClienteDto,
    @Query('lawyerId') lawyerId: string,
  ): Promise<any> {
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

  @Put(':clientId')
  async updateClient(
    @Param('clientId') clientId: string,
    @Body() updateData: CreateClienteDto,
  ): Promise<any> {
    return this.clienteService.updateClient(clientId, updateData);
  }
}

