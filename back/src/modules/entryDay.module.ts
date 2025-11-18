import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryDayController } from 'src/controllers/entryDay.controller';
import { EntryDay } from 'src/entities/entryDay.entity';
import { EntryDayRepository } from 'src/repositories/entryDay.repository';
import { EntryDayService } from 'src/services/entryDay.service';
import { ClienteModule } from './cliente.module';
import { Client } from 'src/entities/client.entity';
import { clientItemModule } from './clientItem.module';
import { ClientItem } from 'src/entities/clientItem.entity';
import { Document } from 'src/entities/document.entity';
import { Audience } from 'src/entities/audience.entity';
import { Meeting } from 'src/entities/meeting.entity';
import { Process } from 'src/entities/process.entity';
import { ProcessModule } from './process.module';
import { ReportsModule } from 'src/reports/reports.module';
import { Lawyer } from 'src/entities/lawyer.entity';
import { AbogadoModule } from './abogado.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntryDay, Client, ClientItem , Document , Audience , Meeting , Process , Lawyer]),
    ClienteModule,
    clientItemModule,
    forwardRef(() => ProcessModule),
    AbogadoModule
    
  ],
  controllers: [EntryDayController],
  providers: [EntryDayService, EntryDayRepository],
  exports: [EntryDayService, EntryDayRepository],
})
export class EntryDayModule {}
