import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudienceController } from '../controllers/audience.controller';
import { Audience } from '../entities/audience.entity';
import { AudienceService } from '../services/audience.service';
import { Client } from 'src/entities/client.entity';
import { clientItemModule } from './clientItem.module';
import { AudiencieRepository } from 'src/repositories/audiencie.repository';
import { AwsS3Service } from 'src/aws/aws.service';
import { EventModule } from './event.module';
import { ParentTouchService } from 'src/services/parent-touch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audience]),
    clientItemModule,
    EventModule,
  ],
  controllers: [AudienceController],
  providers: [
    AudienceService,
    AudiencieRepository,
    AwsS3Service,
    ParentTouchService,
  ],
})
export class AudienceModule {}
