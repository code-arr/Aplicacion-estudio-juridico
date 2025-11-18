// process.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from '../entities/process.entity';
import { clientItemModule } from './clientItem.module';
import { ProcessController } from '../controllers/process.controller';
import { ProcessService } from '../services/process.service';
import { ProcessRepository } from '../repositories/process.repository';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayModule } from './entryDay.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Process , EntryDay]), // 👈 Esto le dice a NestJS que provea el repositorio de la entidad Process
    clientItemModule,
    EntryDayModule // Este módulo debe exportar ClientItemService
  ],
  controllers: [ProcessController],
  providers: [ProcessService, ProcessRepository, ParentTouchService],
  exports: [ProcessService],
})
export class ProcessModule {}
