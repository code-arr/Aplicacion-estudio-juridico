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

      if (entry.trackableType != existingEntryDay?.type) {
        throw new Error('Trackable type mismatch');
      }

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
            console.log(
              `🟡 Se actualiza el tiempo activo del cliente ${client.id} tiempo total del cliente : ${client.activeTime}`,
            );
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
    console.log(lawyerId);

    if (!lawyerId) {
      throw new Error('lawyerId is required');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totals = await this.repo
      .createQueryBuilder('entry')
      .select('entry.clientId', 'clientId')
      .addSelect('SUM(entry.durationSec)', 'totalTime')
      .where('entry.lawyerId = :lawyerId', { lawyerId })
      .andWhere('entry.day BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      })
      .groupBy('entry.clientId')
      .orderBy('SUM(entry.durationSec)', 'DESC') // 👈 cambio clave
      .limit(10)
      .getRawMany();

    if (!totals.length) return [];

    const clients = await Promise.all(
      totals.map(async (t) => {
        const client = await this.clientRepo.findOne({
          where: { id: t.clientId },
          select: ['id', 'firstName'],
        });

        return {
          clientId: t.clientId,
          firstName: client?.firstName || 'Desconocido',
          totalTime: Number(t.totalTime),
        };
      }),
    );

    return clients;
  }
  getWeekNumber(date: Date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  async getClientDetail(lawyerId: string, clientId: string) {
    if (!lawyerId || !clientId)
      throw new Error('lawyerId and clientId are required');

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    // 🔹 Traer todos los EntryDays del año
    const entries = await this.repo
      .createQueryBuilder('entry')
      .select('entry.day', 'day')
      .addSelect('entry.type', 'type')
      .addSelect('SUM(entry.durationSec)', 'totalTime')
      .where('entry.lawyerId = :lawyerId', { lawyerId })
      .andWhere('entry.clientId = :clientId', { clientId })
      .andWhere('entry.day BETWEEN :start AND :end', {
        start: startOfYear,
        end: endOfYear,
      })
      .groupBy('entry.day')
      .addGroupBy('entry.type')
      .orderBy('entry.day', 'ASC')
      .getRawMany();

    if (!entries.length) return null;

    // 🔹 Inicializar contadores
    let totalByDay: Record<string, number> = {};
    let totalByWeek: Record<number, number> = {};
    let totalByMonth: Record<number, number> = {};
    let totalByYear = 0;
    let totalByMonthByType: Record<number, Record<string, number>> = {}; // mes -> type -> tiempo

    entries.forEach((e) => {
      const day = new Date(e.day);
      const month = day.getMonth() + 1;
      const weekNumber = this.getWeekNumber(day);
      const type = e.type;
      const duration = Number(e.totalTime);

      // Día
      const dayKey = day.toISOString().split('T')[0];
      totalByDay[dayKey] = (totalByDay[dayKey] || 0) + duration;

      // Semana
      totalByWeek[weekNumber] = (totalByWeek[weekNumber] || 0) + duration;

      // Mes
      totalByMonth[month] = (totalByMonth[month] || 0) + duration;

      // Año
      totalByYear += duration;

      // 🔹 Por tipo dentro del mes
      if (!totalByMonthByType[month]) totalByMonthByType[month] = {};
      totalByMonthByType[month][type] =
        (totalByMonthByType[month][type] || 0) + duration;
    });

    // 🔹 Traer info del cliente
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      select: ['id', 'firstName', 'lastName', 'email'],
    });

    return {
      clientId: clientId,
      clientName: client
        ? `${client.firstName} ${client.lastName}`
        : 'Desconocido',
      email: client?.email || null,
      totalByDay,
      totalByWeek,
      totalByMonth,
      totalByYear,
      totalByMonthByType, // 🔹 nuevo
    };
  }

  async getMonthlyTimeByLawyer(lawyerId: string) {
    if (!lawyerId) throw new Error('lawyerId is required');

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    // 🔹 Query: sumar durationSec por mes para un abogado específico
    const entries = await this.repo
      .createQueryBuilder('entry')
      .select('EXTRACT(MONTH FROM entry.day)', 'month')
      .addSelect('SUM(entry.durationSec)', 'totalTime')
      .where('entry.lawyerId = :lawyerId', { lawyerId })
      .andWhere('entry.day BETWEEN :start AND :end', {
        start: startOfYear,
        end: endOfYear,
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // 🔹 Transformar en objeto { month: totalTime }
    const result: Record<number, number> = {};
    entries.forEach((e) => {
      const month = Number(e.month);
      const duration = Number(e.totalTime);
      result[month] = duration;
    });

    return result;
  }

  // 🔹 Función helper para obtener número de semana ISO
}
