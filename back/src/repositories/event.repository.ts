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
        `📢 EVENT | 👨‍⚖️ Abogado: ${event.lawyer.firstName} ${event.lawyer.lastName} | ` +
          `Acción: ${event.action} | ` +
          `Entidad: ${event.entityName} | ` +
          `ID: ${event.entityId}`,
      );

      return this.eventRepository.save(event);
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  }
}
