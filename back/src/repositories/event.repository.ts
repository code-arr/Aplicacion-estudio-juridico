import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventDto } from 'src/dtos/event.dto';
import { Event } from 'src/entities/events.entity';
import { AbogadoService } from 'src/services/abogado.service';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private readonly lawyerService: AbogadoService,
  ) {}

  async createEvent(eventData: EventDto): Promise<Event> {
    try {
      const lawyer = await this.lawyerService.getAbogadoById(
        eventData.lawyerId,
      );
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }
      const event = this.eventRepository.create({
        ...eventData,
        lawyer: lawyer,
      });
      console.log(
        `\n📢 [EVENT LOG] \n` +
          `👨‍⚖️  Abogado   : ${event.lawyer.firstName} ${event.lawyer.lastName}\n` +
          `⚡  Acción     : ${event.action}\n` +
          `📂  Entidad    : ${event.entityType}\n` +
          `📝  Nombre     : ${event.entityName}\n` +
          `🆔  ID         : ${event.entityId}\n`,
      );

      return this.eventRepository.save(event);
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  }
}
