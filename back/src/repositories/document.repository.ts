import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DocumentDto } from '../dtos/document.dto';
import { Document } from '../entities/document.entity';
import { ClientItemService } from '../services/clientItem.service';
import * as path from 'path';

import { Repository } from 'typeorm';
import { AwsS3Service } from 'src/aws/aws.service';
import { EventService } from 'src/services/event.service';
import { EventDto } from 'src/dtos/event.dto';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service,
    private readonly eventService: EventService, // <-- Inyectamos el servicio de eventos
  ) {}

  async createDocument(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string,
    lawyerId: string,
    clientId: string
  ): Promise<Document> {
    try {
      const clientItem =
        await this.clientItemService.getClientItemById(clientItemId);

      if (!clientItem) {
        throw new NotFoundException('ClientItem not found');
      }

      const fileExtension = path.extname(originalFileName);
      const safeS3Key = `${Date.now()}-${dbName.replace(/\s/g, '_')}${fileExtension}`;
      let document = this.documentRepository.create();

      // Pasa el mimetype a la función de AWS
      const s3Url = await this.awsS3Service.uploadDocument(
        fileBuffer,
        safeS3Key,
        mimetype,
        clientItemId,
        document.id,
      );

      document.name = dbName;
      document.fileUrl = s3Url;
      document.clientItem = clientItem;
      document.clientId = clientId; // Asigna el clientId al documento
      const type = mimetype.split('/').pop(); // Guarda el tipo de documento (mimetype)
      if (!type) {
        throw new InternalServerErrorException('Invalid file type');
      }
      document.type = type;
      document.size = fileBuffer.length;
      console.log('tamaño : ' + fileBuffer.length);

      const eventData : EventDto = {
        action: 'create',
        entityName: document.name,
        entityId: document.id,
        entityType: document.type,
        lawyerId: lawyerId,
      };

      await this.eventService.createEvent({
        ...eventData
      });

      return await this.documentRepository.save(document);
    } catch (error) {
      console.error('Error creating document:', error);
      throw new InternalServerErrorException('Error creating document');
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.find({ relations: ['clientItem'] });
  }

  async getDocumentByUrl(fileUrl: string): Promise<Document> {
    try {
      const document = await this.documentRepository.findOne({
        where: { fileUrl: fileUrl },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      return document;
    } catch (error) {
      console.error('Error fetching document by URL:', error);
      throw new InternalServerErrorException('Error fetching document');
    }
  }

  async deleteDocumentByUrl(fileUrl: string, documentId: string): Promise<any> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Primero elimina el archivo de S3
      await this.awsS3Service.deleteDocumentByUrl(fileUrl);

      // Luego elimina el registro de la base de datos
      await this.documentRepository.remove(document);

      return document;
    } catch (error) {
      console.error('Error deleting document by URL:', error);
      throw new InternalServerErrorException('Error deleting document');
    }
  }

  async getDocumentsByClientItemId(clientItemId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { clientItem: { id: clientItemId } },
    });
  }

  async seedDocuments() {}
}
