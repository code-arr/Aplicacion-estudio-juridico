// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { EntryDay } from 'src/entities/entryDay.entity';
import { Client } from 'src/entities/client.entity';
import { ClientItem } from 'src/entities/clientItem.entity';
import { EntryDayRepository } from 'src/repositories/entryDay.repository'; // si lo expones como provider
import { Lawyer } from 'src/entities/lawyer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntryDay, Client, ClientItem, Lawyer])],
  controllers: [ReportsController],
  providers: [ReportsService, EntryDayRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
