import { Injectable } from '@nestjs/common';
import { Audience } from 'src/entities/audience.entity';
import { AudiencieRepository } from 'src/repositories/audiencie.repository';

@Injectable()
export class AudienceService {
  constructor(private readonly audiencieRepository: AudiencieRepository) {}

  async createAudience(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string,
    lawyerId: string,
    clientId: string,
    dateTimeIsoUtc: string,
    durationSec: number,
    mode: string,
  ): Promise<Audience> {
    return this.audiencieRepository.createAudience(
      clientItemId,
      fileBuffer,
      originalFileName,
      dbName,
      mimetype,
      lawyerId,
      clientId,
      dateTimeIsoUtc,
      durationSec,
      mode,
    );
  }

  deleteAudienceByUrl(fileUrl: string, audienceId: string): Promise<Audience> {
    return this.audiencieRepository.deleteAudienceByUrl(fileUrl, audienceId);
  }

  async getAllAudiences(): Promise<Audience[]> {
    return this.audiencieRepository.getAllAudiences();
  }

  async getByClientItemId(clientItemId: string): Promise<Audience[]> {
    return this.audiencieRepository.getByClientItemId(clientItemId);
  }

  async updateAudienceName(
    audienceId: string,
    newName: string,
    lawyerId: string,
  ): Promise<Audience> {
    return this.audiencieRepository.updateAudienceName(
      audienceId,
      newName,
      lawyerId,
    );
  }
}
