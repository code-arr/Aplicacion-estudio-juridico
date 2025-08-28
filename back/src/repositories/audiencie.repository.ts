import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import { AwsS3Service } from 'src/aws/aws.service';
import { Audience } from 'src/entities/audience.entity';
import { ClientItemService } from 'src/services/clientItem.service';
import { Repository } from 'typeorm';

@Injectable()
export class AudiencieRepository {
  constructor(
    @InjectRepository(Audience)
    private readonly audiencieRepository: Repository<Audience>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async createAudience(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string, // <-- Agrega el mimetype aquí
  ): Promise<Audience> {
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
        clientItemId
      );

      return await this.audiencieRepository.save({
        name: dbName,
        fileUrl: s3Url,
        clientItem: clientItem,
      });
    } catch (error) {
      console.error('Error creating document:', error);
      throw new InternalServerErrorException('Error creating document');
    }
  }

  async getAllAudiences(): Promise<Audience[]> {
    try {
      return await this.audiencieRepository.find();
    } catch (error) {
      console.error('Error fetching audiences:', error);
      throw new InternalServerErrorException('Error fetching audiences');
    }
  }
}
