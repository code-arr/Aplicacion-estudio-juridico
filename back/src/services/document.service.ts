import { Injectable } from "@nestjs/common";
import { DocumentDto } from "../dtos/document.dto";
import { Document } from "../entities/document.entity";
import { DocumentRepository } from "../repositories/document.repository";

@Injectable()
export class DocumentService {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async createDocument(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string 
  ): Promise<Document> {
    return this.documentRepository.createDocument(
      clientItemId,
      fileBuffer,
      originalFileName,
      dbName,
      mimetype
    );
  }
  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.getAllDocuments();
  }
}