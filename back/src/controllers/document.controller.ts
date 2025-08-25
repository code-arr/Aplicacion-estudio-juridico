import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DocumentDto } from '../dtos/document.dto';
import { Document } from '../entities/document.entity';
import { DocumentService } from '../services/document.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

 @Post('/create/:clientItemId')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('clientItemId') clientItemId: string,
    @Body('fileName') dbName: string,
  ): Promise<Document> {
    const fileBuffer = file.buffer;
    const originalFileName = file.originalname;
    const mimetype = file.mimetype; // <-- Obtenemos el mimetype del archivo

    return this.documentService.createDocument(
      clientItemId,
      fileBuffer,
      originalFileName,
      dbName,
      mimetype, // <-- Pasamos el mimetype al servicio/repositorio
    );
  }

  @Get('getAll')
  async getAllDocuments(): Promise<Document[]> {
    return this.documentService.getAllDocuments();
  }
}
