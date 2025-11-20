import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "src/controllers/admin.controller";
import { Admin } from "src/entities/admin.entity";
import { Audience } from "src/entities/audience.entity";
import { ClientItem } from "src/entities/clientItem.entity";
import { Document } from "src/entities/document.entity";
import { Meeting } from "src/entities/meeting.entity";
import { Process } from "src/entities/process.entity";
import { User } from "src/entities/user.entity";
import { AdminRepository } from "src/repositories/admin.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AdminService } from "src/services/admin.service";
import { UserService } from "src/services/user.service";
import { clientItemModule } from "./clientItem.module";
import { ProcessModule } from "./process.module";
import { MeetingModule } from "./meeting.module";
import { DocumentModule } from "./document.module";
import { AudienceModule } from "./audience.module";
import { Client } from "src/entities/client.entity";
import { ClienteModule } from "./cliente.module";
import { AudienceService } from "src/services/audience.service";
import { MeetingService } from "src/services/meeting.service";
import { AudiencieRepository } from "src/repositories/audiencie.repository";
import { MeetingRepository } from "src/repositories/meeting.repository";
import { GoogleCalendarService } from "src/lib/google/calendar";
import { EventService } from "src/services/event.service";
import { AbogadoService } from "src/services/abogado.service";
import { AwsS3Service } from "src/aws/aws.service";
import { ParentTouchService } from "src/services/parent-touch.service";
import { AbogadoRepository } from "src/repositories/lawyer.repository";
import { Lawyer } from "src/entities/lawyer.entity";
import { Event } from "src/entities/events.entity";
import { EventRepository } from "src/repositories/event.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Admin , User , ClientItem , Process , Meeting , Document , Audience , Client , Lawyer , Event]) , ClienteModule , clientItemModule , ProcessModule , MeetingModule , DocumentModule , AudienceModule],
  controllers: [AdminController],
  providers: [AdminService, AbogadoRepository, AdminRepository , UserService , UserRepository , AudienceService , MeetingService , AudiencieRepository , MeetingRepository , GoogleCalendarService , EventService , AbogadoService , AwsS3Service , ParentTouchService , EventRepository ],
  exports: [AdminService, AdminRepository,UserService , UserRepository],
})
export class AdminModule {}
