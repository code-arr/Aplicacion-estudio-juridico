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

import { DataSource, Repository } from 'typeorm';
import { AwsS3Service } from 'src/aws/aws.service';
import { EventService } from 'src/services/event.service';
import { EventDto } from 'src/dtos/event.dto';
import { ParentTouchService } from 'src/services/parent-touch.service';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service,
    private readonly eventService: EventService,
    private readonly dataSource: DataSource, // <--- inyectá DataSource
    private readonly parentTouch: ParentTouchService, // <--- inyectá el helper
  ) {}

  async createDocument(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string,
    lawyerId: string,
    clientId: string,
  ): Promise<Document> {
    return this.dataSource.transaction(async (manager) => {
      try {
        // 1) Validación de ClientItem (si no lo tenés con relaciones, no importa)
        const clientItem =
          await this.clientItemService.getClientItemById(clientItemId);
        if (!clientItem) {
          throw new NotFoundException('ClientItem not found');
        }

        // 2) Subida a S3 (fuera de TypeORM está ok, pero si falla, se aborta la transacción)
        const fileExtension = path.extname(originalFileName);
        const safeS3Key = `${Date.now()}-${dbName.replace(/\s/g, '_')}${fileExtension}`;

        // Ojo: creamos entidad Document con el manager de la TX
        const documentRepo = manager.getRepository(Document);
        const doc = documentRepo.create();

        const s3Url = await this.awsS3Service.uploadDocument(
          fileBuffer,
          safeS3Key,
          mimetype,
          clientItemId,
          doc.id, // id ya está generado por create()
        );

        const type = mimetype.split('/').pop();
        if (!type) throw new InternalServerErrorException('Invalid file type');

        doc.name = dbName;
        doc.fileUrl = s3Url;
        doc.clientItem = clientItem; // relación
        doc.clientId = clientId; // campo directo
        doc.clientItemId = clientItemId;
        doc.type = type;
        doc.size = fileBuffer.length;

        // 3) Guardamos el documento
        const saved = await documentRepo.save(doc);

        // 4) Log de evento (si falla, también aborta)
        const eventData: EventDto = {
          action: 'create',
          entityName: saved.name,
          entityId: saved.id,
          entityType: saved.type,
          lawyerId: lawyerId,
        };
        await this.eventService.createEvent({ ...eventData });

        // 5) TOCAR padres (dentro de la MISMA transacción)
        await this.parentTouch.touchClientItem(manager, clientItemId);
        await this.parentTouch.touchClient(manager, clientId);

        return saved;
      } catch (error) {
        console.error('Error creating document:', error);
        // cualquier throw acá revierte la TX
        throw new InternalServerErrorException('Error creating document');
      }
    });
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

  async deleteDocumentByUrl(
    fileUrl: string,
    documentId: string,
  ): Promise<Document> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const documentRepo = manager.getRepository(Document);

        // Traemos doc + clientItem (para tener el clientItemId)
        const document = await documentRepo.findOne({
          where: { id: documentId },
          relations: ['clientItem'],
        });

        if (!document) throw new NotFoundException('Document not found');

        const clientItemId = document.clientItem?.id;
        const clientId = document.clientId; // ya lo guardás en la entidad

        // 1) Eliminar archivo de S3 (si falla, aborta TX)
        await this.awsS3Service.deleteDocumentByUrl(fileUrl);

        // 2) Eliminar registro en DB
        await documentRepo.remove(document);

        // 3) TOCAR padres
        if (clientItemId) {
          await this.parentTouch.touchClientItem(manager, clientItemId);
        }
        if (clientId) {
          await this.parentTouch.touchClient(manager, clientId);
        }

        return document;
      } catch (error) {
        console.error('Error deleting document by URL:', error);
        throw new InternalServerErrorException('Error deleting document');
      }
    });
  }

  async getDocumentsByClientItemId(clientItemId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { clientItem: { id: clientItemId } },
    });
  }

  async seedDocuments() {}

  async updateDocument(
  documentId: string,
  newName: string,
  lawyerId: string,
): Promise<Document> {
  return this.dataSource.transaction(async (manager) => {
    try {
      const documentRepo = manager.getRepository(Document);

      // 1) Buscar documento
      const existing = await documentRepo.findOne({
        where: { id: documentId },
        relations: ['clientItem'],
      });
      if (!existing) throw new NotFoundException('Document not found');

      // 2) Actualizar solo el nombre
      existing.name = newName;

      // 3) Guardar cambios
      const saved = await documentRepo.save(existing);

      // 4) Registrar evento
      const eventData: EventDto = {
        action: 'update',
        entityName: saved.name,
        entityId: saved.id,
        entityType: saved.type,
        lawyerId,
      };
      await this.eventService.createEvent(eventData);

      // 5) TOCAR padres
      if (existing.clientItem?.id) {
        await this.parentTouch.touchClientItem(manager, existing.clientItem.id);
      }
      if (existing.clientId) {
        await this.parentTouch.touchClient(manager, existing.clientId);
      }

      return saved;
    } catch (error) {
      console.error('Error updating document name:', error);
      throw new InternalServerErrorException('Error updating document name');
    }
  });
}
}
