import { Injectable } from '@nestjs/common';
import { EventDto } from 'src/dtos/event.dto';
import { Event } from 'src/entities/events.entity';
import { EventRepository } from 'src/repositories/event.repository';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(eventData: EventDto): Promise<Event> {
    try {
      return this.eventRepository.createEvent(eventData);
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  }
}
