import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsController } from 'src/controllers/meeting.controller';
import { ClientItem } from 'src/entities/clientItem.entity';
import { Meeting } from 'src/entities/meeting.entity';
import { User } from 'src/entities/user.entity';
import { GoogleCalendarService } from 'src/lib/google/calendar';
import { ClientItemRepository } from 'src/repositories/clientItem.repository';
import { MeetingRepository } from 'src/repositories/meeting.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { ClientItemService } from 'src/services/clientItem.service';
import { MeetingService } from 'src/services/meeting.service';
import { UserService } from 'src/services/user.service';
import { UsersModule } from './users.module';
import { clientItemModule } from './clientItem.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting]) , UsersModule , clientItemModule],
  controllers: [MeetingsController],
  providers: [MeetingService, GoogleCalendarService, MeetingRepository],
})
export class MeetingModule {}
