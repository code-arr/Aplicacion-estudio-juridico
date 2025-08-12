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
