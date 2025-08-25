import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentController } from "../controllers/document.controller";
import { DocumentRepository } from "../repositories/document.repository";
import { DocumentService } from "../services/document.service";
import { clientItemModule } from "./clientItem.module";
import { Document } from "../entities/document.entity";
import { AwsS3Service } from "../aws/aws.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    forwardRef(() => clientItemModule)
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository , AwsS3Service],
  exports: [DocumentService, DocumentRepository],
})
export class DocumentModule {}