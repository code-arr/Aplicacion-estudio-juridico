import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Lawyer } from '../entities/lawyer.entity';
import { AbogadoService } from '../services/abogado.service';
import { UpdateLawyerDto } from 'src/dtos/updateLawyer.dto';

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
  @Put('deleteClient/:clientId')
  async deleteClientFromLawyer(
    @Query('lawyerId') lawyerId: string,
    @Param('clientId') clientId: string,
  ): Promise<Lawyer | null> {
    return this.abogadoService.deleteClientFromLawyer(lawyerId, clientId);
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
  async getAbogadoById(@Param('id') id: string) {
    return this.abogadoService.getAbogadoById(id);
  }
  @Put('')
  async updateLawyer(
    @Query('lawyerId') lawyerId: string,
    @Body() updateData: UpdateLawyerDto,
  ): Promise<Lawyer> {
    return this.abogadoService.updateLawyer(lawyerId, updateData);
  }
}
