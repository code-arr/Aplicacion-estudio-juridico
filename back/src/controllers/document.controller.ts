import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentDto } from '../dtos/document.dto';
import { Document } from '../entities/document.entity';
import { DocumentService } from '../services/document.service';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post("/create/:clientItemId")
  async createDocument(
    @Body() documentDto: DocumentDto,
    @Param('clientItemId') clientItemId: string,
  ): Promise<Document> {
    return this.documentService.createDocument(documentDto, clientItemId);
  }

  @Get("getAll")
  async getAllDocuments(): Promise<Document[]> {
    return this.documentService.getAllDocuments();
  }
}
