import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { GoogleCalendarService } from '../lib/google/calendar';
import { MeetingDto } from 'src/dtos/meeting.dto';
import { MeetingService } from 'src/services/meeting.service';
import { Meeting } from 'src/entities/meeting.entity';
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
   
  ): Promise<Meeting | null | void> {
    try {
      const meeting = await this.meetingService.createAndSchedule(
        meetingData,
        clientItemId,
        lawyerEmail,
        // cliente principal
      );
      return meeting;
    } catch (error) {
      // NestJS maneja los errores lanzados por el servicio, pero si quieres
      // añadir una lógica de manejo de errores específica, puedes hacerlo aquí.
      throw error;
    }
  }

  @Get("getByClientItemId/:clientItemId")
  async getByClientItemId(@Param("clientItemId") clientItemId: string) {
    return this.meetingService.getByClientItemId(clientItemId);
  }

  @Get("GetAll")
  async getAllMeetings() {
    return this.meetingService.getAllMeetings();
  }
}
