import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AudienceController } from "../controllers/audience.controller";
import { Audience } from "../entities/audience.entity";
import { AudienceService } from "../services/audience.service";
import { Client } from "src/entities/client.entity";
import { clientItemModule } from "./clientItem.module";
import { AudiencieRepository } from "src/repositories/audiencie.repository";
import { AwsS3Service } from "src/aws/aws.service";

@Module({
    imports: [TypeOrmModule.forFeature([Audience]) , clientItemModule],
    controllers: [AudienceController ],
    providers: [AudienceService , AudiencieRepository , AwsS3Service],
})

export class AudienceModule {}