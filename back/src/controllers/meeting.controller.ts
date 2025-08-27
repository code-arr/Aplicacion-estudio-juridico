import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { GoogleCalendarService } from '../lib/google/calendar';
import { MeetingDto } from 'src/dtos/meeting.dto';
import { MeetingService } from 'src/services/meeting.service';
// Asegúrate de que la ruta sea correcta

@Controller('meeting')
export class MeetingsController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post('schedule/:clientItemId')
  @HttpCode(HttpStatus.CREATED)
  async scheduleMeeting(
    @Body() meetingData: MeetingDto,
    @Param('clientItemId') clientItemId: string,
    @Body('lawyerEmail') lawyerEmail: string,
    @Body('to') to: string,
  ) {
    try {
      this.meetingService.createAndSchedule(
        meetingData,
        clientItemId,
        lawyerEmail,
        to,
      );
    } catch (error) {
      // NestJS maneja los errores lanzados por el servicio, pero si quieres
      // añadir una lógica de manejo de errores específica, puedes hacerlo aquí.
      throw error;
    }
  }
}
