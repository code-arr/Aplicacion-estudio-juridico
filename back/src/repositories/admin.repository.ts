import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdministradorDto } from 'src/dtos/admin.dto';
import { Admin } from 'src/entities/admin.entity';
import { AudienceService } from 'src/services/audience.service';
import { ClienteService } from 'src/services/cliente.service';
import { ClientItemService } from 'src/services/clientItem.service';
import { DocumentService } from 'src/services/document.service';
import { MeetingService } from 'src/services/meeting.service';
import { ProcessService } from 'src/services/process.service';
import { UserService } from 'src/services/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private readonly userService: UserService,
    private readonly clientService: ClienteService,
    private readonly audienceService: AudienceService,
    private readonly documentService: DocumentService,
    private readonly meetingService: MeetingService,
    private readonly processService: ProcessService,
    private readonly clientItemService: ClientItemService,
  ) {}

  async createAdmin(data: AdministradorDto): Promise<Admin> {
    const user = await this.userService.findOneByEmail(data.userEmail);
    if (!user) {
      throw new Error('User not found');
    }
    const admin = this.adminRepository.create({
      user: user,
    });
    return this.adminRepository.save(admin);
  }

  async seedAdmin(): Promise<Admin> {
    const newAdmin = await this.createAdmin({
      userEmail: 'admin@example.com',
    });

    return newAdmin;
  }

  async getAdmin(): Promise<Admin | null> {
    const admins = await this.adminRepository.find({
      relations: ['user'],
    });

    return admins[0] || null;
  }

  async deleteClient(clientId: string): Promise<void> {
    const clientData = await this.clientService.getClienteById(clientId);
    if (!clientData) {
      throw new Error('Client not found');
    }
    const clientItemsData = clientData.clientItems;
    for (const clientItem of clientItemsData) {
      if (clientItem.audiences) {
        for (const audience of clientItem.audiences) {
          if (audience.fileUrl) {
            await this.audienceService.deleteAudienceByUrl(
              audience.fileUrl,
              audience.id,
            );
          }
        }
      }
      if (clientItem.documents) {
        for (const document of clientItem.documents) {
          if (document.fileUrl) {
            let versions = document.versions || [];
            for (const version of versions) {
              await this.documentService.deleteVersion(document.id, version.id);
            }
          }
          await this.documentService.deleteDocument(document.id);
        }
        if (clientItem.meetings) {
          for (const meeting of clientItem.meetings) {
            await this.meetingService.deleteMeeting(meeting.id);
          }
        }
        if (clientItem.processes) {
          for (const process of clientItem.processes) {
            await this.processService.deleteProcessFromAdmin(process.id);
          }
        }
      }
      await this.clientItemService.deleteClientItem(clientItem.id);
    }

    await this.clientService.deleteClient(clientId);
  }
}
