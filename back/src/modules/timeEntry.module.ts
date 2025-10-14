// src/time-entries/time-entries.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeEntriesController } from 'src/controllers/timeEntry.controller';
import { TimeEntry } from 'src/entities/timeEntry.entity';
import { TimeEntriesRepository } from 'src/repositories/timeEntry.repository';
import { TimeEntriesService } from 'src/services/timeEntry.service';


@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry])],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService , TimeEntriesRepository],
  exports: [TimeEntriesService, TimeEntriesRepository],
})
export class TimeEntriesModule {}