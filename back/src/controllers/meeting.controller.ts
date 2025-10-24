import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Query,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { GoogleCalendarService } from '../lib/google/calendar';
import { MeetingDto } from 'src/dtos/meeting.dto';
import { MeetingService } from 'src/services/meeting.service';
import { Meeting } from 'src/entities/meeting.entity';
import { UpdateMeetingDto } from 'src/dtos/updateMeeting.dto';
// Asegúrate de que la ruta sea correcta

@Controller('meeting')
export class MeetingsController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post('create/:clientItemId')
  @HttpCode(HttpStatus.CREATED)
  async scheduleMeeting(
    @Body() meetingData: MeetingDto,
    @Param('clientItemId') clientItemId: string,
    @Body('lawyerEmail') lawyerEmail: string,
    @Body('clientId') clientId: string,
  ): Promise<Meeting | null | void> {
    try {
      const meeting = await this.meetingService.createAndSchedule(
        meetingData,
        clientItemId,
        lawyerEmail,
        clientId,
        // cliente principal
      );
      console.log('Reunión programada:', meetingData.name);
      console.log('ID del cliente:', clientId);
      console.log('ID del abogado:', lawyerEmail);

      return meeting;
    } catch (error) {
      // NestJS maneja los errores lanzados por el servicio, pero si quieres
      // añadir una lógica de manejo de errores específica, puedes hacerlo aquí.
      throw error;
    }
  }

  @Put('update/:id')
  async updateMeeting(
    @Param('id') id: string,
    @Body() meetingData: Partial<Meeting>,
  ): Promise<Meeting | null> {
    return this.meetingService.updateMeeting(id, meetingData);
  }

  @Patch('cancel/:id')
  async cancelMeeting(
    @Param('id') id: string,
    @Body('lawyerEmail') lawyerEmail: string,
  ): Promise<Meeting> {
    return this.meetingService.cancelMeeting(id, lawyerEmail);
  }

  @Delete('delete/:id')
  async deleteMeeting(@Param('id') id: string): Promise<Meeting> {
    return this.meetingService.deleteMeeting(id);
  }

  @Get('getByClientItemId/:clientItemId')
  async getByClientItemId(@Param('clientItemId') clientItemId: string) {
    return this.meetingService.getByClientItemId(clientItemId);
  }

  @Get('getAll')
  async getAllMeetings() {
    return this.meetingService.getAllMeetings();
  }

  @Get('getByClientId/:clientId')
  async getByClientId(
    @Param('clientId') clientId: string,
    @Query('lawyerId') lawyerId: string,
  ) {
    return this.meetingService.getByClientId(clientId, lawyerId);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() updateData: UpdateMeetingDto) {
    return this.meetingService.updateMeetingNameOrStatus(id, updateData);
  }
}
