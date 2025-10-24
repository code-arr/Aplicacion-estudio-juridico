import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Audience } from 'src/entities/audience.entity';
import { AudienceService } from 'src/services/audience.service';

@Controller('audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Post('/create/:clientItemId')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('clientItemId') clientItemId: string,
    @Body('name') name: string,
    @Body('clientId') clientId: string,
    @Query('lawyerId') lawyerId: string,
  ): Promise<Audience> {
    const fileBuffer = file.buffer;
    const originalFileName = file.originalname;
    const mimetype = file.mimetype; // <-- Obtenemos el mimetype del archivo

    return this.audienceService.createAudience(
      clientItemId,
      fileBuffer,
      originalFileName,
      name,
      mimetype,
      lawyerId,
      clientId,
    );
  }

  @Delete('/delete/:audienceId')
  async deleteAudienceByUrl(
    @Body('fileUrl') fileUrl: string,
    @Param('audienceId') audienceId: string,
    @Query('lawyerId') lawyerId: string,
  ): Promise<Audience> {
    return this.audienceService.deleteAudienceByUrl(
      fileUrl,
      audienceId,
      lawyerId,
    );
  }

  @Get()
  async getAllAudiences(): Promise<Audience[]> {
    return this.audienceService.getAllAudiences();
  }

  @Get('getByClientItemId/:clientItemId')
  async getByClientItemId(
    @Param('clientItemId') clientItemId: string,
  ): Promise<Audience[]> {
    return this.audienceService.getByClientItemId(clientItemId);
  }
  @Put(':audienceId')
  async updateAudienceName(
    @Param('audienceId') audienceId: string,
    @Body('newName') newName: string,
    @Query('lawyerId') lawyerId: string,
  ) {
    if (!newName || !newName.trim()) {
      throw new BadRequestException('New name is required');
    }

    return await this.audienceService.updateAudienceName(
      audienceId,
      newName.trim(),
      lawyerId,
    );
  }
}

//   @Get('getById/:id')
//   async getAudienceById(@Param('id') id: string): Promise<Audience> {
//     return this.audienceService.getAudienceById(id);
//   }
