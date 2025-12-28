// src/repositories/document.repository.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { DocumentVersion } from 'src/entities/documentVersion.entity';
import { ClientItemService } from '../services/clientItem.service';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { AwsS3Service } from 'src/aws/aws.service';
import { EventService } from 'src/services/event.service';
import { EventDto } from 'src/dtos/event.dto';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { Lawyer } from 'src/entities/lawyer.entity';

export interface VersionWithLawyer {
  id: string;
  versionNumber: number;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  lawyer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private documentVersionRepository: Repository<DocumentVersion>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service,
    private readonly eventService: EventService,
    private readonly dataSource: DataSource,
    private readonly parentTouch: ParentTouchService,
  ) {}

  // Crear documento o nueva versión
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
        const clientItem =
          await this.clientItemService.getClientItemById(clientItemId);
        if (!clientItem) throw new NotFoundException('ClientItem not found');

        const fileExtension = path.extname(originalFileName || '');
        // sanitize: reemplaza espacios, y saca caracteres no alfanuméricos útiles
        const safeName = dbName
          .replace(/\s+/g, '_')
          .normalize('NFD') // separa acentos (mejor compatibilidad)
          .replace(/[\u0300-\u036f]/g, '') // elimina marcas de acento
          .replace(/[^a-zA-Z0-9_\-\.]/g, ''); // deja solo chars seguros
        const safeS3Key = `${Date.now()}-${safeName}${fileExtension}`;

        const documentRepo = manager.getRepository(Document);
        const versionRepo = manager.getRepository(DocumentVersion);

        // buscar documento lógico por name+clientItemId
        let doc = await documentRepo.findOne({
          where: { name: dbName, clientItemId },
          relations: ['versions'],
        });

        // si no existe, crealo (sin archivo aún)
        if (!doc) {
          doc = documentRepo.create({
            name: dbName,
            clientItem,
            clientItemId,
            clientId,
            currentVersion: 0,
            fileUrl: null,
          });
          doc = await documentRepo.save(doc); // para tener id
        }

        // subir a S3
        const s3Url = await this.awsS3Service.uploadDocument(
          fileBuffer,
          safeS3Key,
          mimetype,
          clientItemId,
          doc.id,
        );

        const type = mimetype.split('/').pop();
        if (!type) throw new InternalServerErrorException('Invalid file type');

        // calcular nueva versión
        const lastVersionNumber =
          doc.versions && doc.versions.length
            ? Math.max(...doc.versions.map((v) => v.versionNumber))
            : 0;
        const newVersionNumber = lastVersionNumber + 1;

        // crear DocumentVersion
        const version = versionRepo.create({
          document: doc,
          versionNumber: newVersionNumber,
          fileUrl: s3Url,
          mimeType: mimetype,
          size: fileBuffer.length,
          lawyer: lawyerId ? ({ id: lawyerId } as any) : null,
        });
        const savedVersion = await versionRepo.save(version);

        // actualizar Document "atajo" a la versión activa
        doc.fileUrl = s3Url;
        doc.currentVersion = newVersionNumber;
        doc.updatedAt = new Date();
        // opcional: size/type en Document si querés, pero preferible en versions
        const savedDoc = await documentRepo.save(doc);

        // Event log
        await this.eventService.createEvent({
          action: doc.currentVersion === 1 ? 'create' : 'create_version',
          entityName: savedDoc.name,
          entityId: savedDoc.id,
          entityType: type,
          lawyerId,
        });

        // Touch parents
        await this.parentTouch.touchClientItem(manager, clientItemId);
        await this.parentTouch.touchClient(manager, clientId);

        return savedDoc;
      } catch (error) {
        console.error('Error creating document/version:', error);
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException
        )
          throw error;
        throw new InternalServerErrorException('Error creating document');
      }
    });
  }

  // obtener todos (con versiones)
  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.find({
      // Agregamos 'versions.lawyer'
      relations: ['clientItem', 'versions', 'versions.lawyer'],
    });
  }

  async getDocumentsByClientItemId(clientItemId: string): Promise<Document[]> {
    const documents = await this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.clientItem', 'clientItem')
      .leftJoinAndSelect('document.versions', 'versions')
      // 🔥 ESTA LÍNEA ES LA MAGIA: Trae el objeto Lawyer completo dentro de la versión
      .leftJoinAndSelect('versions.lawyer', 'lawyer')
      .where('document.clientItemId = :clientItemId', { clientItemId })
      // Ordenamos: primero el documento más nuevo
      .orderBy('document.createdAt', 'DESC')
      // Y dentro del doc, la versión más alta primero
      .addOrderBy('versions.versionNumber', 'DESC')
      .getMany();

    return documents;
  }

  async getDocumentsByClientId(clientId: string): Promise<Document[]> {
    console.log('🔍 [Repository] Buscando docs para clientId:', clientId);

    const documents = await this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.clientItem', 'clientItem')
      .leftJoinAndSelect('document.versions', 'versions')
      .leftJoinAndSelect('versions.lawyer', 'lawyer')
      .where('document.clientId = :clientId', { clientId })
      .orderBy('document.createdAt', 'DESC')
      .addOrderBy('versions.versionNumber', 'DESC')
      .getMany();

    console.log('✅ [Repository] Documentos encontrados:', documents.length);
    console.log(
      '📄 [Repository] Detalle:',
      documents.map((d) => ({
        id: d.id,
        name: d.name,
        clientId: d.clientId,
      })),
    );

    return documents;
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

  // obtener versiones ordenadas (desc)
  async getVersionsByDocumentId(
    documentId: string,
  ): Promise<VersionWithLawyer[]> {
    // Usamos el repositorio de DocumentVersion para hacer un query con join al tabla de abogados
    // Cambiá 'lawyers' por el nombre real de la tabla de abogados si es distinto.
    const rows = await this.documentVersionRepository
      .createQueryBuilder('v')
      .leftJoin(Lawyer, 'l', 'l.id = v.uploadedBy')
      .where('v.documentId = :documentId', { documentId })
      .orderBy('v.versionNumber', 'DESC')
      .select([
        'v.id',
        'v.versionNumber',
        'v.fileUrl',
        'v.mimeType',
        'v.size',
        'v.createdAt',
        'l.id',
        'l.firstName',
        'l.lastName',
      ])
      .getRawMany();

    // mapear los raw rows a una forma limpia
    return rows.map((r) => ({
      id: r.v_id,
      versionNumber: r.v_versionNumber,
      fileUrl: r.v_fileUrl,
      mimeType: r.v_mimeType,
      size: r.v_size,
      createdAt: r.v_createdAt,
      lawyer: r.l_id
        ? {
            id: r.l_id,
            firstName: r.l_firstName,
            lastName: r.l_lastName,
          }
        : null,
    }));
  }

  // borrar una versión y reasignar currentVersion/fileUrl si hacía falta
  async deleteVersion(
    documentId: string,
    versionId: string,
  ): Promise<{ document: Document; deletedVersion: DocumentVersion | null }> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const documentRepo = manager.getRepository(Document);
        const versionRepo = manager.getRepository(DocumentVersion);

        const document = await documentRepo.findOne({
          where: { id: documentId },
          relations: ['versions'],
        });
        if (!document) throw new NotFoundException('Document not found');

        const version = await versionRepo.findOne({
          where: { id: versionId },
          relations: ['document'],
        });
        if (!version) throw new NotFoundException('Version not found');

        // eliminar archivo en S3 (si falla, revierte)
        await this.awsS3Service.deleteDocumentByUrl(version.fileUrl);

        // remover la versión
        await versionRepo.remove(version);

        // si la versión borrada era la actual, reasignar al último disponible
        if (version.versionNumber === document.currentVersion) {
          const remaining = await versionRepo.find({
            where: { document: { id: documentId } },
            order: { versionNumber: 'DESC' },
            take: 1,
          });

          if (remaining && remaining.length) {
            document.currentVersion = remaining[0].versionNumber;
            document.fileUrl = remaining[0].fileUrl;
          } else {
            // no quedan versiones
            document.currentVersion = 0;
            document.fileUrl = null;
          }
          await documentRepo.save(document);
        }

        // touch parents
        if (document.clientItemId) {
          await this.parentTouch.touchClientItem(
            manager,
            document.clientItemId,
          );
        }
        if (document.clientId) {
          await this.parentTouch.touchClient(manager, document.clientId);
        }

        return { document, deletedVersion: version };
      } catch (error) {
        console.error('Error deleting version:', error);
        throw new InternalServerErrorException('Error deleting version');
      }
    });
  }

  // borrar documento completo (y sus versiones)
  async deleteDocument(documentId: string): Promise<Document> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const documentRepo = manager.getRepository(Document);
        const versionRepo = manager.getRepository(DocumentVersion);

        const document = await documentRepo.findOne({
          where: { id: documentId },
          relations: ['versions'],
        });
        if (!document) throw new NotFoundException('Document not found');

        // borrar archivos en S3 (intentar borrar todos; si falla, revierte)
        for (const v of document.versions || []) {
          await this.awsS3Service.deleteDocumentByUrl(v.fileUrl);
        }

        // remover document (cascade eliminará versions por relación)
        await documentRepo.remove(document);

        // touch parents
        if (document.clientItemId) {
          await this.parentTouch.touchClientItem(
            manager,
            document.clientItemId,
          );
        }
        if (document.clientId) {
          await this.parentTouch.touchClient(manager, document.clientId);
        }

        return document;
      } catch (error) {
        console.error('Error deleting document:', error);
        throw new InternalServerErrorException('Error deleting document');
      }
    });
  }

  async seedDocuments() {}

  // actualizar nombre (igual que antes)
  async updateDocument(
    documentId: string,
    newName: string,
    lawyerId: string,
  ): Promise<Document> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const documentRepo = manager.getRepository(Document);

        const document = await documentRepo.findOne({
          where: { id: documentId },
          relations: ['versions'],
        });
        if (!document) throw new NotFoundException('Document not found');

        const cleanName = (newName || '').trim();
        if (!cleanName) throw new BadRequestException('New name is required');

        // Opcional: evitar duplicados del mismo nombre en la misma carpeta (clientItem)
        const duplicate = await documentRepo.findOne({
          where: {
            name: cleanName,
            clientItemId: document.clientItemId,
          },
          select: ['id'],
        });
        if (duplicate && duplicate.id !== documentId) {
          throw new BadRequestException(
            'Ya existe un documento con ese nombre en esta carpeta',
          );
        }

        document.name = cleanName;
        // nota: UpdateDateColumn normalmente actualiza solo; igual lo dejamos consistente
        document.updatedAt = new Date();

        const saved = await documentRepo.save(document);

        /* await this.eventService.createEvent({
          action: 'update',
          entityName: saved.name,
          entityId: saved.id,
          // tomamos el mimeType de la versión actual si existe
          entityType: saved.versions?.find(
            (v) => v.versionNumber === saved.currentVersion,
          )?.mimeType,
          lawyerId,
        }); */

        if (document.clientItemId) {
          await this.parentTouch.touchClientItem(
            manager,
            document.clientItemId,
          );
        }
        if (document.clientId) {
          await this.parentTouch.touchClient(manager, document.clientId);
        }

        return saved;
      } catch (error) {
        console.error('Error updating document name:', error);
        // pasar el error original si ya es una excepción de nest para no esconder mensajes útiles
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException
        )
          throw error;
        throw new InternalServerErrorException('Error updating document name');
      }
    });
  }
}

