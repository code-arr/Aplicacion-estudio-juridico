import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DocumentDto } from '../dtos/document.dto';
import { ClientItem } from '../entities/clientItem.entity';
import { Document } from '../entities/document.entity';
import { ClientItemService } from '../services/clientItem.service';
import { Repository } from 'typeorm';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly clientItemService: ClientItemService,
    // private readonly awsS3Service: AwsS3Service,
  ) {}

  // En tu servicio o repositorio de documentos
  // En tu servicio o repositorio
  async createDocument(
    documentDto: DocumentDto,
    clientItemId: string,
  ): Promise<Document> {
    try {
      const clientItem =
        await this.clientItemService.getClientItemById(clientItemId);

      if (!clientItem) {
        throw new NotFoundException('ClientItem not found');
      }

      const documentToSave = {
        ...documentDto,
        clientItem: clientItem,
      };

      return this.documentRepository.save(documentToSave);
    } catch (error) {
      console.log(error);
      throw new Error('Error creating document');
    }
  }

async getAllDocuments(): Promise<Document[]> {
  return this.documentRepository.find({ relations: ['clientItem'] });
}
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
