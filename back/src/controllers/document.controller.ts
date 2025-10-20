import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
    @Body('name') name: string,
    @Body('clientId') clientId: string,
    @Query('lawyerId') lawyerId: string,
  ): Promise<Document> {
    const fileBuffer = file.buffer;
    const originalFileName = file.originalname;
    const mimetype = file.mimetype; // <-- Obtenemos el mimetype del archivo

    return this.documentService.createDocument(
      clientItemId,
      fileBuffer,
      originalFileName,
      name,
      mimetype,
      lawyerId,
      clientId,
    );
  }
  @Delete('/delete/:documentId')
  async deleteDocumentByUrl(
    @Body('fileUrl') fileUrl: string,
    @Param('documentId') documentId: string,
  ): Promise<Document> {
    return this.documentService.deleteDocumentByUrl(fileUrl, documentId);
  }

  @Get('getAll')
  async getAllDocuments(): Promise<Document[]> {
    return this.documentService.getAllDocuments();
  }

  @Get('getByClientItemId/:clientItemId')
  async getDocumentsByClientItemId(
    @Param('clientItemId') clientItemId: string,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByClientItemId(clientItemId);
  }
}
