import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { Client } from 'src/entities/client.entity';
import { EntryDay } from 'src/entities/entryDay.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class EntryDayRepository {
  constructor(
    @InjectRepository(EntryDay)
    private repo: Repository<EntryDay>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async createEntryDay(entryDay: Partial<EntryDay>): Promise<EntryDay> {
    const entity = this.repo.create(entryDay);
    return this.repo.save(entity);
  }

  async updateEntryDay(timeEntries: CreateTimeEntryDto[]): Promise<EntryDay[]> {
    const updatedEntryDays: EntryDay[] = [];

    for (const entry of timeEntries) {
      const entryDayDate = entry.dayKey ? new Date(entry.dayKey) : new Date();

      // 🔹 Buscar por trackableId (como hacías antes)
      const existingEntryDay = await this.repo.findOne({
        where: { trackableId: entry.trackableId },
        order: { day: 'DESC' },
      });

      // 🟢 Caso 1: no existe ninguno con ese trackableId → crear nuevo
      if (!existingEntryDay) {
        const newEntryDay = this.repo.create({
          day: entryDayDate,
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
          type: entry.trackableType,
          clientId: entry.clientId,
        });
        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);
        console.log('🟢 Se crea un entry day (no existía ninguno)');
        continue;
      }

      // 🟠 Caso 2: existe pero con otro día → crear nuevo
      const existingDay = new Date(existingEntryDay.day);
      if (existingDay.getTime() !== entryDayDate.getTime()) {
        const newEntryDay = this.repo.create({
          day: entryDayDate,
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
          type: entry.trackableType,
          clientId: entry.clientId,
        });
        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);
        console.log('🟠 Se crea un nuevo entry day porque cambió el día');
        continue;
      }

      // 🟡 Caso 3: mismo día → actualizar el existente
      existingEntryDay.durationSec += entry.durationSec;
      const saved = await this.repo.save(existingEntryDay);
      updatedEntryDays.push(saved);
      console.log('🟡 Se actualiza el entry day existente');
    }

    for (const entry of updatedEntryDays) {
      this.clientRepo
        .findOne({ where: { id: entry.clientId } })
        .then((client) => {
          if (client) {
            client.activeTime += entry.durationSec;
            this.clientRepo.save(client);
            console.log(`🟡 Se actualiza el tiempo activo del cliente ${client.id} tiempo total del cliente : ${client.activeTime}`);
            
          }
        });
    }

  
    

    return updatedEntryDays;
  }

  async getByClientId(clientId: string, lawyerId: string) {
    const entryDays = await this.repo.find({ where: { clientId, lawyerId } });
    let totalDocumentTime = 0;
    let totalMeetingTime = 0;
    let totalAudienceTime = 0;
    let totalClientTime = 0;
    let totalProcessTime = 0;
    let totalStats: { type: string; durationSec: number }[] = [];
    for (const entryDay of entryDays) {
      if (entryDay.type === 'Document') {
        totalDocumentTime += entryDay.durationSec;
      } else if (entryDay.type === 'Meeting') {
        totalMeetingTime += entryDay.durationSec;
      } else if (entryDay.type === 'Audience') {
        totalAudienceTime += entryDay.durationSec;
      } else if (entryDay.type === 'Client') {
        totalClientTime += entryDay.durationSec;
      } else if (entryDay.type === 'Process') {
        totalProcessTime += entryDay.durationSec;
      }
    }
    totalStats.push({ type: 'Document', durationSec: totalDocumentTime });
    totalStats.push({ type: 'Meeting', durationSec: totalMeetingTime });
    totalStats.push({ type: 'Audience', durationSec: totalAudienceTime });
    totalStats.push({ type: 'Client', durationSec: totalClientTime });
    totalStats.push({ type: 'Process', durationSec: totalProcessTime });
    return totalStats;
  }

  async getTop10ByLawyerId(lawyerId: string) {
    const clients : Client[] = await this.clientRepo.find({where : {lawyers: {id: lawyerId}}});
    if (!clients) {
      return [];
    }

    let top10 : Client[] = [];

    top10 = clients.sort((a, b) => b.activeTime - a.activeTime).slice(0, 10);

    return top10;
  }

  async getClientDetails(clientId: string): Promise<Client | null> {
    const client = await this.clientRepo.findOne({ where: { id: clientId } });
    
    let details : ["totalTime": number ,   ] = [];



    


  }
}
