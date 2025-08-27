import { Injectable } from "@nestjs/common";
import { Audience } from "src/entities/audience.entity";
import { AudiencieRepository } from "src/repositories/audiencie.repository";

@Injectable()
export class AudienceService {
    constructor(
        private readonly audiencieRepository: AudiencieRepository,
    ){}

    async createAudience(
        clientItemId: string,
        fileBuffer: Buffer,
        originalFileName: string,
        dbName: string,
        mimetype: string,
    ): Promise<Audience> {
        return this.audiencieRepository.createAudience(
            clientItemId,
            fileBuffer,
            originalFileName,
            dbName,
            mimetype,
        );
    }

    async getAllAudiences(): Promise<Audience[]> {
        return this.audiencieRepository.getAllAudiences();
    }
}