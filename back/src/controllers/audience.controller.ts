import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Audience } from 'src/entities/audience.entity';
import { AudienceService } from 'src/services/audience.service';

@Controller('audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Post('/createAudience/:clientItemId')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('clientItemId') clientItemId: string,
    @Body('fileName') dbName: string,
  ): Promise<Audience> {
    const fileBuffer = file.buffer;
    const originalFileName = file.originalname;
    const mimetype = file.mimetype; // <-- Obtenemos el mimetype del archivo

    return this.audienceService.createAudience(
      clientItemId,
      fileBuffer,
      originalFileName,
      dbName,
      mimetype, // <-- Pasamos el mimetype al servicio/repositorio
    );
  }

  @Get()
  async getAllAudiences(): Promise<Audience[]> {
    return this.audienceService.getAllAudiences();
  }

  //   @Get('getById/:id')
  //   async getAudienceById(@Param('id') id: string): Promise<Audience> {
  //     return this.audienceService.getAudienceById(id);
  //   }
}
