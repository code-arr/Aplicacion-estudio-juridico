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
      // 1) Normalizar el día a DATE (YYYY-MM-DD) en UTC
      const dayKey = entry.dayKey
        ? new Date(entry.dayKey).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      // 2) Buscar por (trackableId, day)
      const existing = await this.repo.findOne({
        where: { trackableId: entry.trackableId, day: dayKey },
      });

      // 3) Crear si no existe
      if (!existing) {
        const newEntryDay = this.repo.create({
          day: dayKey, // <-- string "YYYY-MM-DD"
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
          type: entry.trackableType,
          clientId: entry.clientId,
        });

        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);

        // actualizar activeTime del cliente (atómico)
        await this.clientRepo.increment(
          { id: entry.clientId },
          'activeTime',
          entry.durationSec,
        );

        // log útil
        console.log('🟢 create EntryDay', {
          trackableId: entry.trackableId,
          day: dayKey,
          durationSec: entry.durationSec,
          type: entry.trackableType,
        });

        continue;
      }

      // 4) Validar tipo solo si existe
      if (entry.trackableType !== existing.type) {
        throw new Error('Trackable type mismatch');
      }

      // 5) Mismo (trackableId, day) → acumular
      existing.durationSec += entry.durationSec;
      const saved = await this.repo.save(existing);
      updatedEntryDays.push(saved);

      // actualizar activeTime del cliente (atómico)
      await this.clientRepo.increment(
        { id: entry.clientId },
        'activeTime',
        entry.durationSec,
      );

      console.log('🟡 update EntryDay (same day)', {
        trackableId: entry.trackableId,
        day: dayKey,
        addedSec: entry.durationSec,
        newTotalSec: saved.durationSec,
      });
    }

    return updatedEntryDays;
  }

  /*   async updateEntryDay(timeEntries: CreateTimeEntryDto[]): Promise<EntryDay[]> {
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
  } */

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
  getWeekNumber(date: Date): number {
    // Cálculo de semana ISO (lunes = primer día de la semana)
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7; // domingo = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // async getClientDetail(lawyerId: string, clientId: string , clientItemId?: string) {
  //   if (!lawyerId || !clientId) {
  //     throw new Error('lawyerId and clientId are required');
  //   }

  //   // Rango: año UTC actual (coincide con tu front)
  //   const now = new Date();
  //   const year = now.getUTCFullYear();
  //   const start = `${year}-01-01`;
  //   const end = `${year}-12-31`;

  //   // 1) Por DÍA — usar to_char para forzar "YYYY-MM-DD"
  //   const byDay = await this.repo
  //     .createQueryBuilder('e')
  //     .select(`to_char(e.day, 'YYYY-MM-DD')`, 'day') // 👈 cambio clave
  //     .addSelect('SUM(e.durationSec)', 'total')
  //     .where('e.lawyerId = :lawyerId', { lawyerId })
  //     .andWhere('e.clientId = :clientId', { clientId })
  //     .andWhere('e.day BETWEEN :start AND :end', { start, end })
  //     .groupBy('day')
  //     .orderBy('day', 'ASC')
  //     .getRawMany<{ day: string; total: string }>();

  //   // ===== 2) Acumulado por SEMANA ISO (Postgres) =====
  //   // EXTRACT(WEEK FROM e.day) evita problemas de zona horaria.
  //   const byWeek = await this.repo
  //     .createQueryBuilder('e')
  //     .select('EXTRACT(WEEK FROM e.day)::int', 'week')
  //     .addSelect('SUM(e.durationSec)', 'total')
  //     .where('e.lawyerId = :lawyerId', { lawyerId })
  //     .andWhere('e.clientId = :clientId', { clientId })
  //     .andWhere('e.day BETWEEN :start AND :end', { start, end })
  //     .groupBy('week')
  //     .orderBy('week', 'ASC')
  //     .getRawMany<{ week: number; total: string }>();

  //   // ===== 3) Acumulado por MES + TIPO (para categorías y total mensual) =====
  //   const byMonthType = await this.repo
  //     .createQueryBuilder('e')
  //     .select('EXTRACT(MONTH FROM e.day)::int', 'month')
  //     .addSelect('e.type', 'type')
  //     .addSelect('SUM(e.durationSec)', 'total')
  //     .where('e.lawyerId = :lawyerId', { lawyerId })
  //     .andWhere('e.clientId = :clientId', { clientId })
  //     .andWhere('e.day BETWEEN :start AND :end', { start, end })
  //     .groupBy('month')
  //     .addGroupBy('e.type')
  //     .orderBy('month', 'ASC')
  //     .getRawMany<{ month: number; type: string; total: string }>();

  //   // Si no hay nada en el año, devolvemos null como antes
  //   if (!byDay.length && !byWeek.length && !byMonthType.length) {
  //     return null;
  //   }

  //   // ===== Armado de MAPS =====
  //   const totalByDay: Record<string, number> = {};
  //   byDay.forEach((r) => {
  //     totalByDay[r.day] = Number(r.total); // r.day ya es "YYYY-MM-DD"
  //   });

  //   const totalByWeek: Record<number, number> = {};
  //   byWeek.forEach((r) => {
  //     totalByWeek[r.week] = Number(r.total);
  //   });

  //   const totalByMonth: Record<number, number> = {};
  //   const totalByMonthByType: Record<number, Record<string, number>> = {};
  //   let totalByYear = 0;

  //   byMonthType.forEach((r) => {
  //     const m = Number(r.month);
  //     const t = r.type;
  //     const v = Number(r.total);

  //     totalByMonth[m] = (totalByMonth[m] ?? 0) + v;
  //     if (!totalByMonthByType[m]) totalByMonthByType[m] = {};
  //     totalByMonthByType[m][t] = (totalByMonthByType[m][t] ?? 0) + v;

  //     totalByYear += v;
  //   });

  //   // ===== Datos del cliente (como antes) =====
  //   const client = await this.clientRepo.findOne({
  //     where: { id: clientId },
  //     select: ['id', 'firstName', 'lastName', 'email'],
  //   });

  //   return {
  //     clientId,
  //     clientName: client
  //       ? `${client.firstName} ${client.lastName}`
  //       : 'Desconocido',
  //     email: client?.email ?? null,
  //     totalByDay, // { 'YYYY-MM-DD': seconds }
  //     totalByWeek, // { 1..53: seconds } (ISO)
  //     totalByMonth, // { 1..12: seconds }
  //     totalByYear, // seconds
  //     totalByMonthByType, // { month: { type: seconds } }
  //   };
  // }

  async getClientDetail(
    lawyerId: string,
    clientId: string,
    clientItemId?: string,
  ) {
    if (!lawyerId || !clientId) {
      throw new Error('lawyerId and clientId are required');
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    // ===== 1) Por DÍA =====
    const byDayQuery = this.repo
      .createQueryBuilder('e')
      .select(`to_char(e.day, 'YYYY-MM-DD')`, 'day')
      .addSelect('SUM(e.durationSec)', 'total')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e.clientId = :clientId', { clientId })
      .andWhere('e.day BETWEEN :start AND :end', { start, end });

    if (clientItemId) {
      byDayQuery.andWhere('e.clientItemId = :clientItemId', { clientItemId });
    }

    const byDay = await byDayQuery
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; total: string }>();

    // ===== 2) Por SEMANA =====
    const byWeekQuery = this.repo
      .createQueryBuilder('e')
      .select('EXTRACT(WEEK FROM e.day)::int', 'week')
      .addSelect('SUM(e.durationSec)', 'total')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e.clientId = :clientId', { clientId })
      .andWhere('e.day BETWEEN :start AND :end', { start, end });

    if (clientItemId) {
      byWeekQuery.andWhere('e.clientItemId = :clientItemId', { clientItemId });
    }

    const byWeek = await byWeekQuery
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany<{ week: number; total: string }>();

    // ===== 3) Por MES + TIPO =====
    const byMonthTypeQuery = this.repo
      .createQueryBuilder('e')
      .select('EXTRACT(MONTH FROM e.day)::int', 'month')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.durationSec)', 'total')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e.clientId = :clientId', { clientId })
      .andWhere('e.day BETWEEN :start AND :end', { start, end });

    if (clientItemId) {
      byMonthTypeQuery.andWhere('e.clientItemId = :clientItemId', {
        clientItemId,
      });
    }

    const byMonthType = await byMonthTypeQuery
      .groupBy('month')
      .addGroupBy('e.type')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: number; type: string; total: string }>();

    if (!byDay.length && !byWeek.length && !byMonthType.length) return null;

    // ===== Armado de maps igual que antes =====
    const totalByDay: Record<string, number> = {};
    byDay.forEach((r) => (totalByDay[r.day] = Number(r.total)));

    const totalByWeek: Record<number, number> = {};
    byWeek.forEach((r) => (totalByWeek[r.week] = Number(r.total)));

    const totalByMonth: Record<number, number> = {};
    const totalByMonthByType: Record<number, Record<string, number>> = {};
    let totalByYear = 0;

    byMonthType.forEach((r) => {
      const m = Number(r.month);
      const t = r.type;
      const v = Number(r.total);

      totalByMonth[m] = (totalByMonth[m] ?? 0) + v;
      if (!totalByMonthByType[m]) totalByMonthByType[m] = {};
      totalByMonthByType[m][t] = (totalByMonthByType[m][t] ?? 0) + v;

      totalByYear += v;
    });

    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      select: ['id', 'firstName', 'lastName', 'email'],
    });

    return {
      clientId,
      clientName: client
        ? `${client.firstName} ${client.lastName}`
        : 'Desconocido',
      email: client?.email ?? null,
      totalByDay,
      totalByWeek,
      totalByMonth,
      totalByYear,
      totalByMonthByType,
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
