// src/services/document.service.ts
import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import {
  DocumentRepository,
  VersionWithLawyer,
} from '../repositories/document.repository';

@Injectable()
export class DocumentService {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async createDocument(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string,
    lawyerId: string,
    clientId: string,
  ): Promise<Document> {
    return this.documentRepository.createDocument(
      clientItemId,
      fileBuffer,
      originalFileName,
      dbName,
      mimetype,
      lawyerId,
      clientId,
    );
  }
  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.getAllDocuments();
  }

  async getDocumentsByClientItemId(clientItemId: string): Promise<Document[]> {
    return this.documentRepository.getDocumentsByClientItemId(clientItemId);
  }

  async getDocumentsByClientId(clientId: string): Promise<Document[]> {
    return this.documentRepository.getDocumentsByClientId(clientId);
  }

  async getDocumentByUrl(fileUrl: string): Promise<Document> {
    return this.documentRepository.getDocumentByUrl(fileUrl);
  }

  async getVersionsByDocumentId(
    documentId: string,
  ): Promise<VersionWithLawyer[]> {
    return this.documentRepository.getVersionsByDocumentId(documentId);
  }

  async deleteVersion(documentId: string, versionId: string) {
    return this.documentRepository.deleteVersion(documentId, versionId);
  }

  async deleteDocument(documentId: string) {
    return this.documentRepository.deleteDocument(documentId);
  }

  async updateDocument(documentId: string, newName: string, lawyerId: string) {
    return this.documentRepository.updateDocument(
      documentId,
      newName,
      lawyerId,
    );
  }
}

