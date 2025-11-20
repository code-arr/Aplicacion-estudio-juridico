// src/entities/documentVersion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { Lawyer } from './lawyer.entity';

@Entity('documentVersions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (doc) => doc.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' }) // FK exacta
  document: Document;

  @Column({ name: 'versionNumber', type: 'int' })
  versionNumber: number;

  @Column({ name: 'fileUrl', type: 'varchar', length: 1000 })
  fileUrl: string;

  @Column({ name: 'mimeType', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ name: 'size', type: 'int', nullable: true })
  size: number | null;

  @ManyToOne(() => Lawyer)
  @JoinColumn({ name: 'uploadedBy' }) // Mapea a la columna existente en BD
  lawyer: Lawyer;

  // Truquito: Para mantener compatibilidad si algo busca el ID suelto
  @Column({ name: 'uploadedBy', nullable: true, insert: false, update: false })
  uploadedBy: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt: Date;
}
