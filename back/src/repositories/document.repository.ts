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

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service, // <-- Inyectamos el servicio S3
  ) {}

  async createDocument(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string, // <-- Agrega el mimetype aquí
  ): Promise<Document> {
    try {
      const clientItem =
        await this.clientItemService.getClientItemById(clientItemId);

      if (!clientItem) {
        throw new NotFoundException('ClientItem not found');
      }

      const fileExtension = path.extname(originalFileName);
      const safeS3Key = `${Date.now()}-${dbName.replace(/\s/g, '_')}${fileExtension}`;

      // Pasa el mimetype a la función de AWS
      const s3Url = await this.awsS3Service.uploadDocument(
        fileBuffer,
        safeS3Key,
        mimetype,
        clientItemId,
      );

      return await this.documentRepository.save({
        name: dbName,
        fileUrl: s3Url,
        clientItem: clientItem,
      });
    } catch (error) {
      console.error('Error creating document:', error);
      throw new InternalServerErrorException('Error creating document');
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.find({relations:["clientItem"]});
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
  ): Promise<any> {
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

      return   document;
    } catch (error) {
      console.error('Error deleting document by URL:', error);
      throw new InternalServerErrorException('Error deleting document');
    }
  }

  async seedDocuments() {}
}

// // src/document/document.service.ts (ejemplo)
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { AwsS3Service } from '../aws/aws-s3.service';
// import { Document } from '../entities/document.entity';

// @Injectable()
// export class DocumentRepository {
//   constructor(
//     @InjectRepository(Document)
//     private documentRepository: Repository<Document>,
//     private readonly awsS3Service: AwsS3Service,
//   ) {}

//   async createDocument(documentName: string, fileBuffer: Buffer, filename: string): Promise<Document> {
//     const documentUrl = await this.awsS3Service.uploadDocument(fileBuffer, filename);

//     const newDocument = this.documentRepository.create({
//       documentName: documentName,
//       documentUrl: documentUrl,
//     });

//     return this.documentRepository.save(newDocument);
//   }
// }
