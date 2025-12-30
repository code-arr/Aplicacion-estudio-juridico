// src/modules/document.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { DocumentVersion } from '../entities/documentVersion.entity';
import { DocumentController } from '../controllers/document.controller';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentService } from '../services/document.service';
import { clientItemModule } from './clientItem.module';
import { AwsS3Service } from '../aws/aws.service';
import { EventModule } from './event.module';
import { ParentTouchService } from '../services/parent-touch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion]),
    EventModule,
    forwardRef(() => clientItemModule),
  ],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentRepository,
    AwsS3Service,
    ParentTouchService,
  ],
  exports: [DocumentService, DocumentRepository, TypeOrmModule],
})
export class DocumentModule {}

