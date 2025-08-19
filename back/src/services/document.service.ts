import { Injectable } from "@nestjs/common";
import { DocumentDto } from "../dtos/document.dto";
import { Document } from "../entities/document.entity";
import { DocumentRepository } from "../repositories/document.repository";

@Injectable()
export class DocumentService {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async createDocument(
    documentDto: DocumentDto,
    clientItemId: string,
  ): Promise<Document> {
    return this.documentRepository.createDocument(documentDto, clientItemId);
  }
  async getAllDocuments(): Promise<Document[]> {
    return this.documentRepository.getAllDocuments();
  }
}