// src/time-entries/time-entries.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeEntriesController } from '../controllers/timeEntry.controller';
import { TimeEntry } from '../entities/timeEntry.entity';
import { TimeEntriesRepository } from '../repositories/timeEntry.repository';
import { TimeEntriesService } from '../services/timeEntry.service';
import { ClienteModule } from './cliente.module';
import { DocumentModule } from './document.module';
import { AudienceModule } from './audience.module';
import { DocumentRepository } from '../repositories/document.repository';
import { AudiencieRepository } from '../repositories/audiencie.repository';
import { ClienteRepository } from '../repositories/client.repository';
import { Client } from '../entities/client.entity';
import { Audience } from '../entities/audience.entity';
import { Document } from '../entities/document.entity';
import { clientItemModule } from './clientItem.module';
import { AwsS3Service } from '../aws/aws.service';
import { ClientItemService } from '../services/clientItem.service';
import { Event } from '../entities/events.entity';
import { EventModule } from './event.module';
import { Lawyer } from '../entities/lawyer.entity';
import { AbogadoModule } from './abogado.module';
import { EntryDay } from '../entities/entryDay.entity';
import { EntryDayModule } from './entryDay.module';



@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry  , EntryDay]), EntryDayModule ],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService , TimeEntriesRepository ,   ],
  exports: [TimeEntriesService, TimeEntriesRepository ]  ,
})
export class TimeEntriesModule {}