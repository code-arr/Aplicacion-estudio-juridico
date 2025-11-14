// src/controllers/document.controller.ts
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
    if (!file) throw new BadRequestException('File required');
    return this.documentService.createDocument(
      clientItemId,
      file.buffer,
      file.originalname,
      name,
      file.mimetype,
      lawyerId,
      clientId,
    );
  }

  @Get('getAll')
  async getAll() {
    return this.documentService.getAllDocuments();
  }

  @Get('getByClientItemId/:clientItemId')
  async getByClientItem(@Param('clientItemId') clientItemId: string) {
    return this.documentService.getDocumentsByClientItemId(clientItemId);
  }

  @Get('/:documentId/versions')
  async getVersions(@Param('documentId') documentId: string) {
    return this.documentService.getVersionsByDocumentId(documentId);
  }

  @Delete(':documentId/version/:versionId')
  async deleteVersion(
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.documentService.deleteVersion(documentId, versionId);
  }

  @Delete(':documentId')
  async deleteDocument(@Param('documentId') documentId: string) {
    return this.documentService.deleteDocument(documentId);
  }

  @Put(':documentId')
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body('newName') newName: string,
    @Query('lawyerId') lawyerId: string,
  ) {
    if (!newName || !newName.trim()) {
      throw new BadRequestException('New name is required');
    }

    return this.documentService.updateDocument(
      documentId,
      newName.trim(),
      lawyerId,
    );
  }
}
