import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { Client, Currency } from 'src/entities/client.entity';
import { ClientItem, status as CIStatus } from 'src/entities/clientItem.entity';
import { EntryDay } from 'src/entities/entryDay.entity';
import { In, Repository } from 'typeorm';

type CostSummaryInput = {
  lawyerId: string;
  clientId: string;
  clientItemId?: string;
  year?: number;
  month?: number;
};

@Injectable()
export class EntryDayRepository {
  constructor(
    @InjectRepository(EntryDay)
    private repo: Repository<EntryDay>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    @InjectRepository(ClientItem)
    private clientItemRepo: Repository<ClientItem>,
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
          clientItemId: entry.clientItemId,
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
      clientItemId: clientItemId ?? null, // ⚡ aquí agregamos el clientItemId
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

  async getCasesSummary(lawyerId: string, clientId?: string) {
    // 1) Por caso (cerrados)
    const qbCase = this.clientItemRepo
      .createQueryBuilder('ci')
      .leftJoin('ci.category', 'cat')
      .leftJoin('ci.section', 'sec')
      .leftJoin('ci.itemType', 'it')
      .select([
        'ci.id AS "clientItemId"',
        'ci.title AS title',
        'ci.createdAt AS "openedAt"',
        'ci.closedAt AS "closedAt"',
        'ci.clientId AS "clientId"',
        'cat.id AS "categoryId"',
        'sec.id AS "sectionId"',
        'it.id AS "itemTypeId"',
        // días a cierre (solo si closed)
        `CASE 
           WHEN ci.status = :closed AND ci.closedAt IS NOT NULL
           THEN EXTRACT(EPOCH FROM (ci."closedAt" - ci."createdAt"))/86400
         END AS "daysToClose"`,
      ])
      .where('ci.lawyerId = :lawyerId', { lawyerId })
      .andWhere('ci.status = :closed', { closed: CIStatus.CLOSED });

    if (clientId) qbCase.andWhere('ci.clientId = :clientId', { clientId });

    const perCase = await qbCase.orderBy('ci.closedAt', 'DESC').getRawMany();

    // 2) Promedio por cliente
    const qbAvgClient = this.clientItemRepo
      .createQueryBuilder('ci')
      .select('ci.clientId', 'clientId')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (ci."closedAt" - ci."createdAt"))/86400)`,
        'avgDaysToClose',
      )
      .where('ci.lawyerId = :lawyerId', { lawyerId })
      .andWhere('ci.status = :closed', { closed: CIStatus.CLOSED })
      .andWhere('ci."closedAt" IS NOT NULL');

    if (clientId) qbAvgClient.andWhere('ci.clientId = :clientId', { clientId });

    const avgByClient = await qbAvgClient
      .groupBy('ci.clientId')
      .getRawMany<{ clientId: string; avgDaysToClose: string }>();

    // 3) Promedio global
    const qbAvgGlobal = this.clientItemRepo
      .createQueryBuilder('ci')
      .select(
        `AVG(EXTRACT(EPOCH FROM (ci."closedAt" - ci."createdAt"))/86400)`,
        'avgDaysToClose',
      )
      .where('ci.lawyerId = :lawyerId', { lawyerId })
      .andWhere('ci.status = :closed', { closed: CIStatus.CLOSED })
      .andWhere('ci."closedAt" IS NOT NULL');

    if (clientId) qbAvgGlobal.andWhere('ci.clientId = :clientId', { clientId });

    const avgGlobalRow = await qbAvgGlobal.getRawOne<{
      avgDaysToClose: string;
    }>();
    const avgGlobal = avgGlobalRow ? Number(avgGlobalRow.avgDaysToClose) : null;

    // 4) Casos por práctica (Category/Section/ItemType)
    const byPractice = await this.clientItemRepo
      .createQueryBuilder('ci')
      .leftJoin('ci.category', 'cat')
      .leftJoin('ci.section', 'sec')
      .leftJoin('ci.itemType', 'it')
      .select('ci.clientId', 'clientId')
      .addSelect('cat.id', 'categoryId')
      .addSelect('sec.id', 'sectionId')
      .addSelect('it.id', 'itemTypeId')
      .addSelect('COUNT(*)', 'cases')
      .where('ci.lawyerId = :lawyerId', { lawyerId })
      .andWhere('ci.status IN (:...sts)', {
        sts: [CIStatus.OPEN, CIStatus.ON_HOLD, CIStatus.CLOSED],
      })
      .groupBy('ci.clientId')
      .addGroupBy('cat.id')
      .addGroupBy('sec.id')
      .addGroupBy('it.id')
      .getRawMany();

    return {
      perCase: perCase.map((r) => ({
        ...r,
        daysToClose: r.daysToClose != null ? Number(r.daysToClose) : null,
      })),
      avgByClient: avgByClient.map((r) => ({
        clientId: r.clientId,
        avgDaysToClose: Number(r.avgDaysToClose),
      })),
      avgGlobal,
      byPractice: byPractice.map((r) => ({ ...r, cases: Number(r.cases) })),
    };
  }

  // Gastos: asumo una tabla "expenses" con FK a clientItems. Si todavía no existe, tomalo como blueprint.
  async getCasesExpenses(lawyerId: string, clientId?: string) {
    // reemplazar por @InjectRepository(Expense) si ya la tenés
    const rowsPerCase = await this.clientItemRepo.query(
      `
      SELECT ci.id AS "clientItemId",
             SUM(e.amount) AS "totalExpense"
      FROM clientItems ci
      JOIN expenses e ON e."clientItemId" = ci.id
      WHERE ci."lawyerId" = $1
      ${clientId ? 'AND ci."clientId" = $2' : ''}
      GROUP BY ci.id
      `,
      clientId ? [lawyerId, clientId] : [lawyerId],
    );

    const rowsAvgType = await this.clientItemRepo.query(
      `
      SELECT it.id AS "itemTypeId",
             AVG(x."totalExpense") AS "avgExpense"
      FROM (
        SELECT e."clientItemId", SUM(e.amount) AS "totalExpense"
        FROM expenses e
        JOIN clientItems ci ON ci.id = e."clientItemId"
        WHERE ci."lawyerId" = $1
        ${clientId ? 'AND ci."clientId" = $2' : ''}
        GROUP BY e."clientItemId"
      ) x
      JOIN clientItems ci ON ci.id = x."clientItemId"
      JOIN "itemTypes" it ON it.id = ci."itemTypeId"
      GROUP BY it.id
      `,
      clientId ? [lawyerId, clientId] : [lawyerId],
    );

    const rowsAvgClient = await this.clientItemRepo.query(
      `
      SELECT ci."clientId" AS "clientId",
             AVG(x."totalExpense") AS "avgExpense"
      FROM (
        SELECT e."clientItemId", SUM(e.amount) AS "totalExpense"
        FROM expenses e
        JOIN clientItems ci ON ci.id = e."clientItemId"
        WHERE ci."lawyerId" = $1
        ${clientId ? 'AND ci."clientId" = $2' : ''}
        GROUP BY e."clientItemId"
      ) x
      JOIN clientItems ci ON ci.id = x."clientItemId"
      GROUP BY ci."clientId"
      `,
      clientId ? [lawyerId, clientId] : [lawyerId],
    );

    return {
      perCase: rowsPerCase.map((r: any) => ({
        clientItemId: r.clientItemId,
        totalExpense: Number(r.totalExpense),
      })),
      avgByCaseType: rowsAvgType.map((r: any) => ({
        itemTypeId: r.itemTypeId,
        avgExpense: Number(r.avgExpense),
      })),
      avgByClient: rowsAvgClient.map((r: any) => ({
        clientId: r.clientId,
        avgExpense: Number(r.avgExpense),
      })),
    };
  }

  async getCostSummary({
    lawyerId,
    clientId,
    clientItemId,
    year,
    month,
  }: CostSummaryInput) {
    if (!lawyerId || !clientId)
      throw new Error('lawyerId and clientId are required');

    // Rango (default = año actual completo)
    const now = new Date();
    const y = year ?? now.getUTCFullYear();

    const start = month
      ? new Date(Date.UTC(y, month - 1, 1))
      : new Date(Date.UTC(y, 0, 1));
    const end = month
      ? new Date(Date.UTC(y, month, 0, 23, 59, 59))
      : new Date(Date.UTC(y, 11, 31, 23, 59, 59));

    // Sumar segundos
    const qb = this.repo
      .createQueryBuilder('e')
      .select('SUM(e.durationSec)', 'totalSec')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e.clientId = :clientId', { clientId })
      .andWhere('e.day BETWEEN :start AND :end', {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      });

    if (clientItemId) {
      qb.andWhere('e.clientItemId = :clientItemId', { clientItemId });
    }

    const row = await qb.getRawOne<{ totalSec: string | null }>();
    const totalSec = Number(row?.totalSec ?? 0);
    const totalHours = totalSec / 3600;

    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      select: ['id', 'hourlyRate', 'currency', 'firstName', 'lastName'],
    });

    // Si no hay tarifa → costo 0
    const hourlyRate = client?.hourlyRate ? Number(client.hourlyRate) : 0;
    const currency = client?.currency ?? Currency.CLP;

    const totalCost = +(totalHours * hourlyRate).toFixed(2);

    return {
      scope: {
        year: y,
        month: month ?? null,
        lawyerId,
        clientId,
        clientItemId: clientItemId ?? null,
      },
      time: {
        totalSec,
        totalHours: +totalHours.toFixed(2),
      },
      pricing: {
        hourlyRate,
        currency,
      },
      totalCost,
      // opcional: string formateado (si querés devolver ya formateado)
      formatted: {
        hourlyRate: formatMoney(hourlyRate, currency),
        totalCost: formatMoney(totalCost, currency),
      },
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
}

// Helper de backend para formatear EXACTO como te pidieron
function formatMoney(amount: number, currency: Currency): string {
  if (currency === Currency.CLP) {
    // $1.345.987  (sin decimales, separador de miles = '.')
    const parts = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${parts}`;
  }
  if (currency === Currency.UF) {
    // UF 3,45 (coma decimal, miles con '.')
    const with2 = amount.toFixed(2).replace('.', ','); // decimal coma
    // opcional: miles con '.' antes de la coma
    const [int, dec] = with2.split(',');
    const intMiles = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `UF ${intMiles},${dec}`;
  }
  // USD → el ejemplo que dieron: "USD 1,600"
  // (coma de miles y SIN decimales en el ejemplo)
  const noDec = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `USD ${noDec}`;
}
