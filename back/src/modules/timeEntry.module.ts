// src/time-entries/time-entries.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeEntriesController } from 'src/controllers/timeEntry.controller';
import { TimeEntry } from 'src/entities/timeEntry.entity';
import { TimeEntriesRepository } from 'src/repositories/timeEntry.repository';
import { TimeEntriesService } from 'src/services/timeEntry.service';
import { ClienteModule } from './cliente.module';
import { DocumentModule } from './document.module';
import { AudienceModule } from './audience.module';
import { DocumentRepository } from 'src/repositories/document.repository';
import { AudiencieRepository } from 'src/repositories/audiencie.repository';
import { ClienteRepository } from 'src/repositories/client.repository';
import { Client } from 'src/entities/client.entity';
import { Audience } from 'src/entities/audience.entity';
import { Document } from 'src/entities/document.entity';
import { clientItemModule } from './clientItem.module';
import { AwsS3Service } from 'src/aws/aws.service';
import { ClientItemService } from 'src/services/clientItem.service';
import { Event } from 'src/entities/events.entity';
import { EventModule } from './event.module';
import { Lawyer } from 'src/entities/lawyer.entity';
import { AbogadoModule } from './abogado.module';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayModule } from './entryDay.module';



@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry  , EntryDay]), EntryDayModule ],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService , TimeEntriesRepository ,   ],
  exports: [TimeEntriesService, TimeEntriesRepository ]  ,
})
export class TimeEntriesModule {}