import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import { AwsS3Service } from 'src/aws/aws.service';
import { EventDto } from 'src/dtos/event.dto';
import { Audience } from 'src/entities/audience.entity';
import { ClientItemService } from 'src/services/clientItem.service';
import { EventService } from 'src/services/event.service';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AudiencieRepository {
  constructor(
    @InjectRepository(Audience)
    private readonly audiencieRepository: Repository<Audience>,
    private readonly clientItemService: ClientItemService,
    private readonly awsS3Service: AwsS3Service,
    private readonly eventService: EventService,
    private readonly dataSource: DataSource, // 👈 inyectar
    private readonly parentTouch: ParentTouchService, // 👈 inyectar
  ) {}

  async createAudience(
    clientItemId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    dbName: string,
    mimetype: string,
    lawyerId: string,
    clientId: string,
  ): Promise<Audience> {
    return this.dataSource.transaction(async (manager) => {
      // 👈 TX
      try {
        // 1) Validar ClientItem
        const clientItem =
          await this.clientItemService.getClientItemById(clientItemId);
        if (!clientItem) throw new NotFoundException('ClientItem not found');

        // 2) Preparar entidad con el manager de la TX
        const audienceRepo = manager.getRepository(Audience);
        const audience = audienceRepo.create();

        // 3) Subir a S3
        const fileExtension = path.extname(originalFileName);
        const safeS3Key = `${Date.now()}-${dbName.replace(/\s/g, '_')}${fileExtension}`;
        const s3Url = await this.awsS3Service.uploadDocument(
          fileBuffer,
          safeS3Key,
          mimetype,
          clientItemId,
          audience.id, // id generado por create()
        );

        // 4) Completar campos y persistir
        audience.name = dbName;
        audience.fileUrl = s3Url;
        audience.clientItem = clientItem;
        audience.clientId = clientId;
        audience.clientItemId = clientItemId;

        const saved = await audienceRepo.save(audience);

        // 5) Evento
        const eventData: EventDto = {
          action: 'create',
          entityName: saved.name,
          entityId: saved.id,
          entityType: 'Audience',
          lawyerId,
        };
        await this.eventService.createEvent(eventData);

        // 6) TOCAR padres (solo si todo lo anterior salió bien)
        await this.parentTouch.touchClientItem(manager, clientItemId);
        await this.parentTouch.touchClient(manager, clientId);

        return saved;
      } catch (error) {
        console.error('Error creating audience:', error);
        throw new InternalServerErrorException('Error creating audience');
      }
    });
  }

  async deleteAudienceByUrl(
    fileUrl: string,
    audienceId: string,
    lawyerId: string,
  ): Promise<Audience> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const audienceRepo = manager.getRepository(Audience);

        const audience = await audienceRepo.findOne({
          where: { id: audienceId },
          relations: ['clientItem'],
        });
        if (!audience) throw new NotFoundException('Audience not found');

        const clientItemId = audience.clientItem?.id;
        const clientId = audience.clientId;

        // 1) Eliminar archivo en S3
        await this.awsS3Service.deleteDocumentByUrl(fileUrl);

        // 2) Eliminar registro en DB
        await audienceRepo.remove(audience);

        // 3) Evento (opcional; si usás eventos de delete)
        const eventData: EventDto = {
          action: 'delete',
          entityName: audience.name,
          entityId: audience.id,
          entityType: 'Audience',
          lawyerId,
        };
        await this.eventService.createEvent(eventData);

        // 4) TOCAR padres
        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return audience;
      } catch (error) {
        console.error('Error deleting audience by URL:', error);
        throw new InternalServerErrorException('Error deleting audience');
      }
    });
  }

  async getAllAudiences(): Promise<Audience[]> {
    try {
      return await this.audiencieRepository.find();
    } catch (error) {
      console.error('Error fetching audiences:', error);
      throw new InternalServerErrorException('Error fetching audiences');
    }
  }
  async getByClientItemId(clientItemId: string): Promise<Audience[]> {
    try {
      return await this.audiencieRepository.find({
        where: { clientItem: { id: clientItemId } },
      });
    } catch (error) {
      console.error('Error fetching audiences by client item ID:', error);
      throw new InternalServerErrorException(
        'Error fetching audiences by client item ID',
      );
    }
  }

  async updateAudienceName(
    audienceId: string,
    newName: string,
    lawyerId: string,
  ): Promise<Audience> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const audienceRepo = manager.getRepository(Audience);

        // 1) Buscar la audiencia
        const audience = await audienceRepo.findOne({
          where: { id: audienceId },
          relations: ['clientItem'],
        });
        if (!audience) throw new NotFoundException('Audience not found');

        // 2) Actualizar el nombre
        audience.name = newName;

        // 3) Guardar cambios
        const updated = await audienceRepo.save(audience);

        // 4) Crear evento
        const eventData: EventDto = {
          action: 'update',
          entityName: updated.name,
          entityId: updated.id,
          entityType: 'Audience',
          lawyerId,
        };
        await this.eventService.createEvent(eventData);

        // 5) TOCAR padres
        const clientItemId = updated.clientItem?.id;
        const clientId = updated.clientId;
        if (clientItemId)
          await this.parentTouch.touchClientItem(manager, clientItemId);
        if (clientId) await this.parentTouch.touchClient(manager, clientId);

        return updated;
      } catch (error) {
        console.error('Error updating audience name:', error);
        throw new InternalServerErrorException('Error updating audience name');
      }
    });
  }
}
