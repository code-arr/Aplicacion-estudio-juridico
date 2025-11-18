import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { groupEnd } from 'console';
import { CreateTimeEntryDto } from 'src/dtos/timeEntry.dto';
import { Audience } from 'src/entities/audience.entity';
import { Client, clientType, Currency } from 'src/entities/client.entity';
import { ClientItem, status as CIStatus } from 'src/entities/clientItem.entity';
import { Document } from 'src/entities/document.entity';
import { EntryDay } from 'src/entities/entryDay.entity';
import { Lawyer } from 'src/entities/lawyer.entity';
import { Meeting } from 'src/entities/meeting.entity';
import { Process } from 'src/entities/process.entity';
import { resolveEffectivePricing } from 'src/utils/rates.util';
import { Between, In, Repository } from 'typeorm';

type CostSummaryInput = {
  lawyerId: string;
  clientId: string;
  clientItemId?: string;
  year?: number;
  month?: number;
};

function toNumber(n?: string | null): number {
  return n ? Number(n) : 0;
}
function secToHours(sec: number): number {
  return Math.round((sec / 3600) * 10) / 10;
}
function yearBounds(y: number) {
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

type TaskDetail = {
  day: string;
  description: string;
  durationSec: number;
  trackableId: string | null;
  lawyerId: string;
  lawyerName: string;
  hourlyRate?: number; // NUEVO: tarifa aplicada a esa tarea (opcional)
  currency?: Currency; // NUEVO: moneda aplicada para esa tarea (opcional)
  cost?: { raw: number; currency: Currency }; // o directamente costo ya calculado por tarea
};

/**
 * Estructura agrupada final por caso/proyecto (ClientItem)
 */
export type GroupedClientDetail = {
  clientItemId: string | null;
  clientName: string | null;
  types: Record<string, number>;
  totalByMonth: number; // horas (o segundos según convención — en tu código es horas)
  hourlyRate?: number; // NUEVO: tarifa efectiva del clientItem (si aplica)
  currency?: Currency; // NUEVO: moneda del clientItem
  tasks: TaskDetail[];
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
    @InjectRepository(Process)
    private ProcessRepo: Repository<Process>,
    @InjectRepository(Meeting)
    private MeetingRepo: Repository<Meeting>,
    @InjectRepository(Document)
    private DocumentRepo: Repository<Document>,
    @InjectRepository(Audience)
    private AudienceRepo: Repository<Audience>,
    @InjectRepository(Lawyer)
    private LawyerRepo: Repository<Lawyer>,
  ) {}

  async createEntryDay(entryDay: Partial<EntryDay>): Promise<EntryDay> {
    const entity = this.repo.create(entryDay);
    return this.repo.save(entity);
  }

  async deleteEntryDay(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private async getDetailedTaskData(entry: EntryDay) {
    const trackableId = (entry as any).trackableId;

    // 1. Caso: Entradas sin trackableId ("Extras")
    if (!trackableId) {
      return {
        description: 'Extras / Tareas sin objeto asociado',
        trackableId: null,
        isFallback: false, // No es un fallo, es una categoría válida
      };
    }

    let detailedEntry: any = null;

    // 2. Búsqueda del objeto asociado
    switch (entry.type) {
      case 'Process':
        detailedEntry = await this.ProcessRepo.findOne({
          where: { id: trackableId },
        });
        break;
      case 'Meeting':
        detailedEntry = await this.MeetingRepo.findOne({
          where: { id: trackableId },
        });
        break;
      case 'Document':
        detailedEntry = await this.DocumentRepo.findOne({
          where: { id: trackableId },
        });
        break;
      case 'Audience':
        detailedEntry = await this.AudienceRepo.findOne({
          where: { id: trackableId },
        });
        break;
      default:
        // Caso: Tipo desconocido
        return {
          description: 'Otras tareas / Tipo de objeto no rastreado',
          trackableId,
          isFallback: false,
        };
    }

    // 3. Lógica de EXCLUSIÓN: Si la búsqueda falló, descartar la entrada.
    if (!detailedEntry) {
      return null; // 🛑 El objeto asociado no existe, la entrada será filtrada.
    }

    // 4. Lógica de ASIGNACIÓN (Solo si se encontró el objeto)
    let description: string = '';
    const fallbackDescription = 'Objeto Encontrado (Sin Nombre)';

    switch (entry.type) {
      case 'Process':
        description =
          detailedEntry.name ||
          detailedEntry.description ||
          fallbackDescription;
        break;
      case 'Meeting':
        description =
          detailedEntry.name || detailedEntry.subject || fallbackDescription;
        break;
      case 'Document':
        description =
          detailedEntry.name || detailedEntry.fileName || fallbackDescription;
        break;
      case 'Audience':
        description =
          detailedEntry.name || detailedEntry.summary || fallbackDescription;
        break;
    }

    // 5. Determinar isFallback final
    const isFallback = description === fallbackDescription;

    return { description, trackableId, isFallback };
  }

  async getClientDetailByMonth(
    lawyerId: string,
    month: number,
    year: number,
    clientId?: string,
  ): Promise<GroupedClientDetail[]> {
    if (!lawyerId || !month || !year || !clientId) {
      throw new Error('lawyerId, clientId, month and year are required');
    }

    // Paso 1: Traer todas las entries del mes y año indicados
    const entries = await this.repo.find({
      where: {
        day: Between(
          new Date(year, month - 1, 1).toISOString().split('T')[0],
          new Date(year, month, 0).toISOString().split('T')[0],
        ),
        lawyerId,
        clientId,
      },
      select: [
        'id',
        'day',
        'durationSec',
        'type',
        'clientItemId',
        'trackableId',
        'lawyerId',
      ],
    });

    // --- PREFETCH para evitar N+1 ---
    const processIds = new Set<string>();
    const meetingIds = new Set<string>();
    const documentIds = new Set<string>();
    const audienceIds = new Set<string>();
    const clientItemIdSet = new Set<string>();

    entries.forEach((e) => {
      if (e.trackableId) {
        switch (e.type) {
          case 'Process':
            processIds.add(e.trackableId);
            break;
          case 'Meeting':
            meetingIds.add(e.trackableId);
            break;
          case 'Document':
            documentIds.add(e.trackableId);
            break;
          case 'Audience':
            audienceIds.add(e.trackableId);
            break;
        }
      }
      if (e.clientItemId) clientItemIdSet.add(e.clientItemId);
    });

    // 1) Prefetch por tipo (máximo 4 queries) y prefetchear clientItems (titles)
    const [processes, meetings, documents, audiences, clientItems] =
      await Promise.all([
        processIds.size
          ? this.ProcessRepo.findBy({ id: In([...processIds]) })
          : Promise.resolve([]),
        meetingIds.size
          ? this.MeetingRepo.findBy({ id: In([...meetingIds]) })
          : Promise.resolve([]),
        documentIds.size
          ? this.DocumentRepo.findBy({ id: In([...documentIds]) })
          : Promise.resolve([]),
        audienceIds.size
          ? this.AudienceRepo.findBy({ id: In([...audienceIds]) })
          : Promise.resolve([]),
        clientItemIdSet.size
          ? this.clientItemRepo.findBy({
              id: In([...clientItemIdSet]),
            })
          : Promise.resolve([]),
      ]);

    const processMap = new Map(processes.map((p) => [p.id, p]));
    const meetingMap = new Map(meetings.map((m) => [m.id, m]));
    const documentMap = new Map(documents.map((d) => [d.id, d]));
    const audienceMap = new Map(audiences.map((a) => [a.id, a]));
    const clientItemMap = new Map(
      clientItems.map((ci) => [
        ci.id,
        {
          title: ci.title ?? null,
          hourlyRate: (ci as any).hourlyRate ?? undefined,
          currency: (ci as any).currency ?? undefined,
          raw: ci,
        },
      ]),
    );

    // 3) Helper local que obtiene { description, trackableId, isFallback } o null (si no existe)
    const getDetailFromMaps = (entry: EntryDay) => {
      if (!entry.trackableId) {
        return {
          description: 'Extras / Tareas sin objeto asociado',
          trackableId: null,
          isFallback: false,
        };
      }

      const id = entry.trackableId;
      const fallback = 'Objeto Encontrado (Sin Nombre)';
      let obj: any;
      let description = fallback;

      switch (entry.type) {
        case 'Process':
          obj = processMap.get(id);
          if (!obj) return null;
          description = obj.name || obj.description || fallback;
          break;
        case 'Meeting':
          obj = meetingMap.get(id);
          if (!obj) return null;
          description = obj.name || obj.subject || fallback;
          break;
        case 'Document':
          obj = documentMap.get(id);
          if (!obj) return null;
          description =
            obj.name ||
            (obj.fileUrl ? obj.fileUrl.split('/').pop() : '') ||
            fallback;
          break;
        case 'Audience':
          obj = audienceMap.get(id);
          if (!obj) return null;
          description = obj.name || obj.summary || fallback;
          break;
        default:
          return {
            description: 'Otras tareas / Tipo de objeto no rastreado',
            trackableId: id,
            isFallback: false,
          };
      }

      const isFallback = description === fallback;
      return { description, trackableId: id, isFallback };
    };

    // 4) Construir lawyerNameCache (ya lo tenías arriba — lo re-uso)
    const lawyerIds = [
      ...new Set(entries.map((e) => e.lawyerId).filter(Boolean)),
    ];
    const lawyers = lawyerIds.length
      ? await this.LawyerRepo.find({
          where: { id: In(lawyerIds) },
          select: ['id', 'firstName', 'lastName'],
        })
      : [];
    const lawyerNameCache: Record<string, string> = lawyers.reduce(
      (acc, l) => {
        acc[l.id] =
          `${l.firstName || ''} ${l.lastName || ''}`.trim() ||
          'Abogado Desconocido';
        return acc;
      },
      {} as Record<string, string>,
    );

    // 5) Generar entriesWithDetails SIN consultas adicionales (map + filter)
    const entriesWithDetails = entries
      .map((entry) => {
        const detail = getDetailFromMaps(entry);
        if (detail === null) return null; // objeto asociado no existe -> filtrar

        const lawyerName =
          lawyerNameCache[entry.lawyerId] || 'Abogado Desconocido';
        return {
          ...entry,
          detailDescription: detail.description,
          isFallback: detail.isFallback ?? false,
          lawyerName,
          // opcional: incluir clientItemTitle directo para usar en agrupado sin buscar DB
          clientItemTitle: entry.clientItemId
            ? (clientItemMap.get(entry.clientItemId)?.title ?? null)
            : null,
        };
      })
      .filter((e) => e !== null) as Array<any>;

    // Función auxiliar para formatear la fecha a YYYY-MM-DD
    /*    const entryDayDate = (entry: EntryDay) =>
      (entry.day as any) instanceof Date
        ? entry.day.split('T')[0]
        : String(entry.day); */

    const entryDayDate = (entry: EntryDay) => {
      // Normalizamos a unknown para que TS deje usar instanceof sin error
      const raw: unknown = (entry as any).day;

      // 1) Si ya es Date válido, lo usamos
      if (raw instanceof Date && !isNaN(raw.getTime())) {
        return raw.toISOString().slice(0, 10);
      }

      // 2) Intentamos parsear como Date (maneja strings "YYYY-MM-DD" o timestamps)
      const parsed = new Date(String(raw));
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }

      // 3) Fallback: devolvemos la representación tal cual (recortada por precaución)
      return String(raw).slice(0, 10);
    };

    /* // 2. Obtener los IDs de todos los abogados únicos
    const lawyerIds = [...new Set(entries.map((e) => e.lawyerId))].filter(
      (id) => id,
    );

    // 3. Traer los nombres de todos los abogados en UNA sola consulta
    const lawyers = await this.LawyerRepo.find({
      where: { id: In(lawyerIds) },
      select: ['id', 'firstName', 'lastName'],
    });

    // 4. Crear un caché de nombres: { 'lawyerId': 'Nombre Completo' }
    const lawyerNameCache: Record<string, string> = lawyers.reduce(
      (acc, lawyer) => {
        const fullName = `${lawyer.firstName} ${lawyer.lastName}`.trim();
        acc[lawyer.id] = fullName;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Paso 2: Obtener descripciones detalladas, filtrar nulos y adjuntar el nombre del abogado
    const entriesWithDetails = (
      await Promise.all(
        entries.map(async (entry) => {
          // detailedTaskData puede ser { description, trackableId, isFallback } o null
          const detailedTaskData = await this.getDetailedTaskData(entry);

          // 🛑 FILTRADO EN MAPEO: Si es null (objeto no encontrado), devolvemos null aquí.
          if (detailedTaskData === null) {
            return null;
          }

          const name = lawyerNameCache[entry.lawyerId] || 'Abogado Desconocido';

          return {
            ...entry,
            detailDescription: detailedTaskData.description,
            isFallback: detailedTaskData.isFallback ?? false,
            lawyerName: name,
          };
        }),
      )
    )
      // 🛑 FILTRADO FINAL: Remueve todos los elementos que devolvieron null (tareas sin coincidencia)
      .filter((entry) => entry !== null); */

    // Paso 3: Crear un mapa por clientItemId con solo las entradas válidas
    const grouped: Record<string, GroupedClientDetail> = {};

    for (const entry of entriesWithDetails) {
      const key = entry.clientItemId ?? 'no-clientItem';

      if (!grouped[key]) {
        // Traer nombre del clientItem si existe (Lógica original)
        let clientName: string | null = null;
        if (entry.clientItemId) {
          clientName = clientItemMap.get(entry.clientItemId)?.title ?? null;
        }

        const clientItemMeta = entry.clientItemId
          ? clientItemMap.get(entry.clientItemId)
          : undefined;

        grouped[key] = {
          clientItemId: entry.clientItemId ?? null,
          clientName,
          totalByMonth: 0,
          types: {},
          tasks: [],
          hourlyRate: clientItemMeta?.hourlyRate,
          currency: clientItemMeta?.currency,
        };
      }

      // 1. Sumar al total del mes en horas y tipos (código original)
      const hours = secToHours(entry.durationSec);

      grouped[key].totalByMonth += hours;
      if (!grouped[key].types[entry.type]) grouped[key].types[entry.type] = 0;
      grouped[key].types[entry.type] += hours;

      // 2. Almacenar el detalle granular de la tarea CON INFO DEL ABOGADO
      const clientItemMeta = entry.clientItemId
        ? clientItemMap.get(entry.clientItemId)
        : undefined;

      grouped[key].tasks.push({
        day: entryDayDate(entry),
        durationSec: entry.durationSec,
        type: entry.type,
        description: entry.detailDescription,
        trackableId: entry.trackableId ?? null,
        lawyerId: entry.lawyerId,
        lawyerName: entry.lawyerName,
        // tarifa específica de la tarea (si hubiera una columna en EntryDay con tarifa),
        // o tomamos la tarifa del clientItem (si existe). Ajustá según tu modelo.
        hourlyRate: (entry as any).hourlyRate ?? clientItemMeta?.hourlyRate,
        currency: (entry as any).currency ?? clientItemMeta?.currency,
      } as TaskDetail);
    }

    // Paso 4: Convertir el mapa a array
    return Object.values(grouped);
  }
  async updateEntryDay(timeEntries: CreateTimeEntryDto[]): Promise<EntryDay[]> {
    const updatedEntryDays: EntryDay[] = [];

    for (const entry of timeEntries) {
      // 1) Normalizar el día a DATE (YYYY-MM-DD) en UTC
      const dayKey = entry.dayKey
        ? new Date(entry.dayKey).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      // 2) Buscar por (trackableId, day, lawyerId) <--- 🛑 ¡CAMBIO CLAVE!
      // Solo buscamos la entrada existente de ESTE abogado para ESTA tarea/día.
      const existing = await this.repo.findOne({
        where: {
          trackableId: entry.trackableId,
          day: dayKey,
          lawyerId: entry.lawyerId, // <--- Se añade lawyerId a la condición
        },
      });

      // 3) Crear si no existe (Esto incluye si la tarea/día existe, pero es de otro abogado)
      if (!existing) {
        const newEntryDay = this.repo.create({
          day: dayKey, // <-- string "YYYY-MM-DD"
          durationSec: entry.durationSec,
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId, // El ID del nuevo abogado se almacena
          type: entry.trackableType,
          clientId: entry.clientId,
          clientItemId: entry.clientItemId,
        });

        const saved = await this.repo.save(newEntryDay);
        updatedEntryDays.push(saved);

        // actualizar activeTime del cliente (atómico)
        if (entry.clientId) {
          await this.clientRepo.increment(
            { id: entry.clientId },
            'activeTime',
            entry.durationSec,
          );
        }

        // log útil
        console.log('🟢 create EntryDay (Nuevo Abogado o Nueva Tarea)', {
          trackableId: entry.trackableId,
          lawyerId: entry.lawyerId,
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

      // 5) Mismo (trackableId, day, lawyerId) → acumular <--- 🛑 ¡IMPLÍCITO!
      // Si llegamos aquí, 'existing' pertenece al mismo abogado, por lo que ACUMULAMOS.
      existing.durationSec += entry.durationSec;

      // Opcional: Si el `clientItemId` es más específico en la nueva entrada, podrías actualizarlo aquí
      if (entry.clientItemId && existing.clientItemId !== entry.clientItemId) {
        existing.clientItemId = entry.clientItemId;
      }

      const saved = await this.repo.save(existing);
      updatedEntryDays.push(saved);

      // actualizar activeTime del cliente (atómico)
      if (entry.clientId) {
        await this.clientRepo.increment(
          { id: entry.clientId },
          'activeTime',
          entry.durationSec,
        );
      }

      console.log('🟡 update EntryDay (Mismo Abogado)', {
        trackableId: entry.trackableId,
        lawyerId: entry.lawyerId,
        day: dayKey,
        addedSec: entry.durationSec,
        newTotalSec: saved.durationSec,
      });
    }

    return updatedEntryDays;
  }

  async getTop10ByLawyerId(lawyerId: string) {
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
      .where('entry."lawyerId" = :lawyerId::uuid', { lawyerId })
      /* .andWhere('entry.day BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      }) */
      .andWhere('entry."clientId" IS NOT NULL')
      .andWhere('entry.day BETWEEN :start::date AND :end::date', {
        start: startOfMonth.toISOString().slice(0, 10),
        end: endOfMonth.toISOString().slice(0, 10),
      })
      .groupBy('entry.clientId')
      .orderBy('"totalTime"', 'DESC')
      /* .orderBy('SUM(entry.durationSec)', 'DESC') // 👈 cambio clave */
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
      .andWhere('e."clientId" IS NOT NULL')
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
      .andWhere('e."clientId" IS NOT NULL')
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
      .andWhere('e."clientId" IS NOT NULL')
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

    // 1) Total segundos (para time.totalSec / time.totalHours)
    const qb = this.repo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e."clientId" IS NOT NULL')
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

    // 2) Ahora: obtener totalSec por clientItemId para el mismo rango (para aplicar overrides por case)
    const rowsByItem = await this.repo
      .createQueryBuilder('e')
      .select('COALESCE(e."clientItemId"::text, :noItem)', 'clientItemId')
      .addSelect('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .where('e.lawyerId = :lawyerId', { lawyerId })
      .andWhere('e."clientId" = :clientId', { clientId })
      .andWhere('e.day BETWEEN :start AND :end', {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      })
      .groupBy('COALESCE(e."clientItemId"::text, :noItem)')
      .setParameters({ noItem: 'no-clientItem' })
      .getRawMany<{ clientItemId: string; totalSec: string }>();

    // 3) Traer clientItems involucrados (omitir 'no-clientItem')
    const itemIds = rowsByItem
      .map((r) => r.clientItemId)
      .filter((id) => id && id !== 'no-clientItem');
    const clientItemsById = new Map<string, any>();
    if (itemIds.length) {
      const cis = await this.clientItemRepo.find({
        where: { id: In(itemIds) },
        relations: ['client'],
        select: [
          'id',
          'hourlyRateOverride',
          'currencyOverride',
          'client',
        ] as any,
      });
      cis.forEach((ci) => clientItemsById.set(ci.id, ci));
    }

    // 4) Traer cliente (fallback tarifario)
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      select: [
        'id',
        'hourlyRate',
        'currency',
        'firstName',
        'lastName',
        'companyName',
        'legalRepresentative',
        'type',
      ] as any, // TypeORM select typing workaround
    });

    // construir un nombre amigable que funcione para persona física o compañía
    const clientDisplayName = client
      ? client.type === clientType.JURIDICA
        ? (client.companyName ?? client.legalRepresentative ?? 'Empresa')
        : `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
          'Desconocido'
      : 'Desconocido';

    // 5) Acumular por moneda sin mezclar ni convertir
    const costsByCurrency: Record<string, number> = {};
    const usedCurrencies = new Set<string>();

    for (const r of rowsByItem) {
      const secs = Number(r.totalSec ?? 0);
      const hours = secs / 3600;

      let pricing;
      if (r.clientItemId === 'no-clientItem') {
        pricing = resolveEffectivePricing({ clientItem: null, client });
      } else {
        const ci = clientItemsById.get(r.clientItemId);
        pricing = resolveEffectivePricing({ clientItem: ci ?? null, client });
      }

      const rate = pricing.hourlyRate ?? 0;
      const cur = (pricing.currency as string) ?? 'UNKNOWN';
      const cost = rate * hours;

      costsByCurrency[cur] = (costsByCurrency[cur] ?? 0) + cost;
      usedCurrencies.add(cur);
    }

    // 6) Formatear salida
    const roundedCostsByCurrency = Object.fromEntries(
      Object.entries(costsByCurrency).map(([k, v]) => [
        k,
        Math.round(v * 100) / 100,
      ]),
    );

    const formattedCostsByCurrency = Object.fromEntries(
      Object.entries(roundedCostsByCurrency).map(([k, v]) => {
        // usá formatMoney sólo para monedas conocidas; si 'UNKNOWN' mantené el número
        if (k === 'CLP' || k === 'USD' || k === 'UF') {
          return [k, formatMoney(v as number, k as any)];
        }
        return [k, v];
      }),
    );

    const mixedCurrency =
      Array.from(usedCurrencies).filter((c) => c !== 'UNKNOWN').length > 1;

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
        // tarifa fallback del cliente (puede no reflejar overrides individuales)
        hourlyRate: client?.hourlyRate ? Number(client.hourlyRate) : 0,
        currency: (client?.currency as Currency) ?? null,
      },
      costsByCurrency: roundedCostsByCurrency, // números decimales, por moneda
      mixedCurrency,
      client: {
        id: client?.id ?? null,
        name: clientDisplayName,
        // opcional: devolver si es juridica o fisica
        type: client?.type ?? null,
      },
      formatted: {
        costsByCurrencyFormatted: formattedCostsByCurrency,
      },
    };
  }

  /* --------------NUEVO----------------------- */

  async statsCaseCycle(clientItemId: string) {
    if (!clientItemId)
      throw new BadRequestException('clientItemId is required');

    const item = await this.clientItemRepo.findOne({
      where: { id: clientItemId },
      relations: { client: true, lawyer: true },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        closedAt: true,
        client: { id: true },
        lawyer: { id: true },
      },
    });
    if (!item) throw new BadRequestException('clientItem not found');

    const { totalSec }: any = await this.repo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .andWhere('e."clientId" IS NOT NULL')
      .where('e."clientItemId" = :id', { id: clientItemId })
      .getRawOne<{ totalSec: string }>();

    const created = item.createdAt ? new Date(item.createdAt) : null;
    const closed = item.closedAt ? new Date(item.closedAt) : null;
    const now = new Date();

    const daysToClose =
      created && closed ? Math.ceil((+closed - +created) / 86400000) : null;
    const daysOpen =
      created && !closed ? Math.ceil((+now - +created) / 86400000) : null;

    return {
      clientItemId,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt,
      closedAt: item.closedAt ?? null,
      daysToClose,
      daysOpen,
      worked: {
        totalSec: toNumber(totalSec),
        totalHours: secToHours(toNumber(totalSec)),
      },
    };
  }

  async statsCaseCost(clientItemId: string) {
    if (!clientItemId)
      throw new BadRequestException('clientItemId is required');

    // 1) Traer el clientItem junto con su client (para fallback tarifario)
    const item = await this.clientItemRepo.findOne({
      where: { id: clientItemId },
      relations: { client: true },
      select: {
        id: true,
        // campos nuevos / overrides
        hourlyRateOverride: true,
        currencyOverride: true,
        // client fallback
        client: { id: true, hourlyRate: true, currency: true },
      } as any,
    });

    if (!item) throw new BadRequestException('clientItem not found');

    // 2) Obtener total de segundos trabajados para este caso
    const { totalSec }: any = await this.repo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .andWhere('e."clientId" IS NOT NULL')
      .where('e."clientItemId" = :id', { id: clientItemId })
      .getRawOne<{ totalSec: string }>();

    const hours = secToHours(toNumber(totalSec));

    // 3) Resolver tarifa aplicada: override del item > tarifa del cliente padre
    // item.hourlyRateOverride y item.currencyOverride pueden ser string | null
    const itemRate =
      item.hourlyRateOverride !== undefined && item.hourlyRateOverride !== null
        ? Number(item.hourlyRateOverride)
        : null;
    const itemCurrency = item.currencyOverride ?? null;

    const clientRate =
      item.client && item.client.hourlyRate
        ? Number(item.client.hourlyRate)
        : 0;
    const clientCurrency = item.client?.currency ?? null;

    const appliedRate = itemRate ?? clientRate;
    const appliedCurrency = itemCurrency ?? clientCurrency ?? null;

    // 4) Calcular costo (solo por la moneda aplicada). No se hacen conversiones.
    const costForCurrency = Math.round(appliedRate * hours * 100) / 100;

    // 5) Preparar salida consistente con el resto de endpoints (costsByCurrency)
    const costsByCurrency = appliedCurrency
      ? { [appliedCurrency]: costForCurrency }
      : { UNKNOWN: costForCurrency };

    const formattedCostsByCurrency = Object.fromEntries(
      Object.entries(costsByCurrency).map(([k, v]) => {
        if (k === 'CLP' || k === 'USD' || k === 'UF') {
          return [k, formatMoney(v as number, k as any)];
        }
        return [k, v];
      }),
    );

    return {
      clientItemId,
      time: { totalHours: hours, totalSec: toNumber(totalSec) },
      pricing: {
        // detalle para UI: override (si existe) y fallback del cliente
        hourlyRateOverride: itemRate,
        currencyOverride: itemCurrency,
        clientHourlyRate: clientRate,
        clientCurrency: clientCurrency,
        appliedRate,
        appliedCurrency,
      },
      costsByCurrency,
      formatted: {
        costsByCurrencyFormatted: formattedCostsByCurrency,
      },
    };
  }

  async statsClientAverages(
    clientId: string,
    year?: number,
    closedOnly = false,
  ) {
    if (!clientId) throw new BadRequestException('clientId is required');

    const itemWhere: any = { client: { id: clientId } };
    if (closedOnly) itemWhere.status = CIStatus.CLOSED;

    const items = await this.clientItemRepo.find({
      where: itemWhere,
      select: ['id', 'status', 'createdAt', 'closedAt'],
    });

    // Traer tarifa del cliente (fallback)
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      select: ['hourlyRate', 'currency'],
    });
    const clientFallbackRate = client?.hourlyRate
      ? Number(client.hourlyRate)
      : 0;
    const clientFallbackCurrency = (client?.currency as Currency) ?? null;

    if (!items.length) {
      return {
        clientId,
        cases: { total: 0, open: 0, closed: 0 },
        hours: { total: 0, avgPerCase: 0 },
        cost: {
          currency: clientFallbackCurrency,
          avgPerCase: 0,
          costsByCurrency: {},
        },
        timeToClose: { avgDays: 0 },
        pricing: {
          hourlyRate: clientFallbackRate,
          currency: clientFallbackCurrency,
        },
      };
    }

    const qb = this.repo
      .createQueryBuilder('e')
      .select('e."clientItemId"', 'clientItemId')
      .addSelect('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .where('e."clientId" = :clientId', { clientId })
      .andWhere('e."clientId" IS NOT NULL')
      .groupBy('e."clientItemId"');

    if (year) {
      const { start, end } = yearBounds(year);
      qb.andWhere('e.day BETWEEN :start AND :end', { start, end });
    }

    const rows = await qb.getRawMany<{
      clientItemId: string;
      totalSec: string;
    }>();
    const secByItem = new Map(
      rows.map((r) => [r.clientItemId, toNumber(r.totalSec)]),
    );

    const totalSec = items.reduce(
      (acc, it) => acc + (secByItem.get(it.id) ?? 0),
      0,
    );
    const totalHours = secToHours(totalSec);
    const totalCases = items.length;
    const openCount = items.filter((i) => i.status !== CIStatus.CLOSED).length;
    const closedCount = items.length - openCount;

    const avgHoursPerCase = totalCases
      ? Math.round((totalHours / totalCases) * 10) / 10
      : 0;

    // ---- NUEVO: calcular costos por moneda ----
    // traer clientItems involucrados con overrides + su client (fallback local por si alguien cambió)
    const itemIds = rows.map((r) => r.clientItemId).filter(Boolean);
    const clientItems = itemIds.length
      ? await this.clientItemRepo.find({
          where: { id: In(itemIds) },
          relations: ['client'],
          select: [
            'id',
            'hourlyRateOverride',
            'currencyOverride',
            'client',
          ] as any,
        })
      : [];
    const itemMap = new Map(clientItems.map((ci) => [ci.id, ci]));

    const costsByCurrency: Record<string, number> = {};
    for (const r of rows) {
      const secs = toNumber(r.totalSec);
      const hrs = secToHours(secs);

      const ci = itemMap.get(r.clientItemId);
      // si no hay clientItem en el map (puede pasar), usamos fallback client global
      const pricing = resolveEffectivePricing({
        clientItem: ci ?? null,
        client: ci?.client ?? client,
      });

      const rate = pricing.hourlyRate ?? 0;
      const cur = pricing.currency ?? 'UNKNOWN';
      const cost = rate * hrs;

      costsByCurrency[cur] = (costsByCurrency[cur] ?? 0) + cost;
    }

    // Formatear y detectar mixedCurrency
    const roundedCostsByCurrency = Object.fromEntries(
      Object.entries(costsByCurrency).map(([k, v]) => [
        k,
        Math.round(v * 100) / 100,
      ]),
    );
    const knownCurrencies = Object.keys(roundedCostsByCurrency).filter(
      (c) => c !== 'UNKNOWN',
    );
    const mixedCurrency = knownCurrencies.length > 1;

    // avg cost per case sólo si hay una única moneda conocida (sino null)
    let avgCostPerCase = 0;
    let costCurrency: Currency | null = null;
    if (!mixedCurrency && knownCurrencies.length === 1) {
      costCurrency = knownCurrencies[0] as Currency;
      const totalCostSingle = roundedCostsByCurrency[costCurrency] ?? 0;
      avgCostPerCase = totalCases
        ? Math.round((totalCostSingle / totalCases) * 100) / 100
        : 0;
    }

    return {
      clientId,
      cases: { total: totalCases, open: openCount, closed: closedCount },
      hours: { total: totalHours, avgPerCase: avgHoursPerCase },
      cost: {
        currency: costCurrency,
        avgPerCase: avgCostPerCase,
        costsByCurrency: roundedCostsByCurrency,
        mixedCurrency,
      },
      timeToClose: {
        avgDays: (() => {
          const closedItems = items.filter((i) => i.closedAt && i.createdAt);
          if (!closedItems.length) return 0;
          const sumDays = closedItems.reduce(
            (acc, i) =>
              acc +
              Math.ceil(
                (+new Date(i.closedAt!) - +new Date(i.createdAt)) / 86400000,
              ),
            0,
          );
          return Math.round(sumDays / closedItems.length);
        })(),
      },
      pricing: {
        hourlyRate: clientFallbackRate,
        currency: clientFallbackCurrency,
      },
    };
  }

  async statsStudyAverages(year?: number, lawyerId?: string) {
    // --- 1) Horas y costos agregados por caso (EntryDay) ---
    const qb = this.repo
      .createQueryBuilder('e')
      .select('e."clientItemId"', 'clientItemId')
      .addSelect('e."clientId"', 'clientId')
      .addSelect('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      .groupBy('e."clientItemId"')
      .addGroupBy('e."clientId"');

    if (year) {
      const { start, end } = yearBounds(year);
      qb.where('e.day BETWEEN :start AND :end', { start, end });
    }
    if (lawyerId) {
      qb.andWhere('e."lawyerId" = :lawyerId', { lawyerId });
    }

    const rows = await qb.getRawMany<{
      clientItemId: string;
      clientId: string;
      totalSec: string;
    }>();

    const emptyResponse = {
      scope: lawyerId ? 'lawyer' : 'studio',
      year: year ?? null,
      totals: {
        clients: 0,
        cases: 0,
        hours: 0,
        cost: { raw: 0, currency: null as Currency | null },
      },
      averages: {
        costPerClient: { raw: 0, currency: null as Currency | null },
        costPerCase: { raw: 0, currency: null as Currency | null },
        resolutionDaysAvg: 0,
      },
    };

    // --- 2) Promedio de resolución (clientItems cerrados) ---
    const qbRes = this.clientItemRepo
      .createQueryBuilder('ci')
      .select(
        `AVG(EXTRACT(EPOCH FROM (ci."closedAt" - ci."createdAt"))/86400)`,
        'avgDaysToClose',
      )
      .where('ci.status = :closed', { closed: CIStatus.CLOSED })
      .andWhere('ci."closedAt" IS NOT NULL');

    if (lawyerId) qbRes.andWhere('ci."lawyerId" = :lawyerId', { lawyerId });
    if (year) {
      const { start, end } = yearBounds(year);
      qbRes.andWhere('ci."closedAt" BETWEEN :start AND :end', { start, end });
    }

    const rowRes = await qbRes.getRawOne<{ avgDaysToClose: string | null }>();
    const resolutionDaysAvg = rowRes?.avgDaysToClose
      ? Math.round(Number(rowRes.avgDaysToClose))
      : 0;

    if (!rows.length) {
      return {
        ...emptyResponse,
        averages: { ...emptyResponse.averages, resolutionDaysAvg },
      };
    }

    // --- 3) Cargar tarifas por cliente y overrides por clientItem ---
    const clientIds = Array.from(new Set(rows.map((r) => r.clientId)));
    const clients = await this.clientRepo.find({
      where: { id: In(clientIds) },
      select: ['id', 'hourlyRate', 'currency'],
    });
    const rateByClient = new Map(
      clients.map((c) => [
        c.id,
        {
          rate: c.hourlyRate ? Number(c.hourlyRate) : 0,
          currency: c.currency ?? null,
        },
      ]),
    );

    // Obtener todos los clientItems mencionados para leer overrides y su client
    const itemIds = Array.from(
      new Set(rows.map((r) => r.clientItemId).filter(Boolean)),
    );
    const clientItems = itemIds.length
      ? await this.clientItemRepo.find({
          where: { id: In(itemIds) },
          relations: ['client'],
          select: [
            'id',
            'hourlyRateOverride',
            'currencyOverride',
            'client',
          ] as any,
        })
      : [];
    const itemMap = new Map(clientItems.map((ci) => [ci.id, ci]));

    // --- 4) Calcular totales y costos por moneda ---
    const costsByCurrency: Record<string, number> = {};
    const clientSet = new Set<string>();
    let totalHours = 0;
    let casesCount = 0;

    for (const r of rows) {
      const secs = toNumber(r.totalSec);
      const hrs = secToHours(secs);
      totalHours += hrs;
      casesCount += 1;
      clientSet.add(r.clientId);

      const ci = itemMap.get(r.clientItemId);
      const pricing = resolveEffectivePricing({
        clientItem: ci ?? null,
        client: ci?.client ?? {
          hourlyRate: rateByClient.get(r.clientId)?.rate ?? 0,
          currency: rateByClient.get(r.clientId)?.currency ?? null,
        },
      });

      const rate = pricing.hourlyRate ?? 0;
      const cur = pricing.currency ?? 'UNKNOWN';
      const cost = rate * hrs;

      costsByCurrency[cur] = (costsByCurrency[cur] ?? 0) + cost;
    }

    const roundedCostsByCurrency = Object.fromEntries(
      Object.entries(costsByCurrency).map(([k, v]) => [
        k,
        Math.round(v * 100) / 100,
      ]),
    );
    const knownCurrencies = Object.keys(roundedCostsByCurrency).filter(
      (c) => c !== 'UNKNOWN',
    );
    const mixedCurrency = knownCurrencies.length > 1;

    // totals
    const clientsCount = clientSet.size;
    const costPerCase = 0; // if single currency compute below
    const totalCostSingle =
      !mixedCurrency && knownCurrencies.length === 1
        ? (roundedCostsByCurrency[knownCurrencies[0]] ?? 0)
        : null;

    const costPerCaseVal =
      totalCostSingle !== null
        ? casesCount
          ? Math.round((totalCostSingle / casesCount) * 100) / 100
          : 0
        : null;
    const costPerClientVal =
      totalCostSingle !== null
        ? clientsCount
          ? Math.round((totalCostSingle / clientsCount) * 100) / 100
          : 0
        : null;

    return {
      scope: lawyerId ? 'lawyer' : 'studio',
      year: year ?? null,
      totals: {
        clients: clientsCount,
        cases: casesCount,
        hours: Math.round(totalHours * 10) / 10,
        cost: {
          raw: totalCostSingle ?? null,
          currency:
            knownCurrencies.length === 1
              ? (knownCurrencies[0] as Currency)
              : null,
          costsByCurrency: roundedCostsByCurrency,
        },
      },
      averages: {
        costPerClient: {
          raw: costPerClientVal ?? 0,
          currency:
            knownCurrencies.length === 1
              ? (knownCurrencies[0] as Currency)
              : null,
        },
        costPerCase: {
          raw: costPerCaseVal ?? 0,
          currency:
            knownCurrencies.length === 1
              ? (knownCurrencies[0] as Currency)
              : null,
        },
        resolutionDaysAvg,
      },
      totalsBreakdown: {
        mixedCurrency,
        costsByCurrency: roundedCostsByCurrency,
      },
    };
  }

  async statsPracticeAreas(
    clientId: string,
    level: 'category' | 'section' | 'itemType' = 'itemType',
    includeHours = false,
    includeCost = false,
    year?: number,
  ) {
    if (!clientId) throw new BadRequestException('clientId is required');

    const alias = { category: 'cat', section: 'sec', itemType: 'it' }[level];

    // 1) Conteo de casos por área (igual que antes)
    const counts = await this.clientItemRepo
      .createQueryBuilder('ci')
      .leftJoin('ci.category', 'cat')
      .leftJoin('ci.section', 'sec')
      .leftJoin('ci.itemType', 'it')
      .select(`${alias}.name`, 'name')
      .addSelect('COUNT(ci.id)', 'cases')
      .where('ci."clientId" = :clientId::uuid', { clientId })
      .andWhere('ci."clientId" IS NOT NULL')
      .andWhere(`${alias}.name IS NOT NULL`)
      .groupBy(`${alias}.name`)
      .orderBy('cases', 'DESC')
      .getRawMany<{ name: string; cases: string }>();

    // Si no queremos horas ni costos, devolvemos rápido con counts
    if (!includeHours && !includeCost) {
      const items = counts.map((r) => ({
        name: r.name,
        cases: Number(r.cases),
      }));
      return { clientId, level, items };
    }

    // --- 2) Horas por área + campos de pricing en la misma query para evitar N+1 ---
    // Usamos leftJoin ClientItem (ci) y su client para fallback tarifario
    const ed = this.repo
      .createQueryBuilder('e')
      .leftJoin(ClientItem, 'ci', 'ci.id = e."clientItemId"::uuid')
      .leftJoin('ci.category', 'cat')
      .leftJoin('ci.section', 'sec')
      .leftJoin('ci.itemType', 'it')
      .leftJoin('ci.client', 'client') // fallback tarifario local por caso
      .select(`${alias}.name`, 'name')
      .addSelect('COALESCE(SUM(e.durationSec),0)', 'totalSec')
      // selects extra para coste: override del case y tarifa del client (fallback)
      .addSelect('ci.hourlyRateOverride', 'ci_hourlyOverride')
      .addSelect('ci.currencyOverride', 'ci_currencyOverride')
      .addSelect('client.hourlyRate', 'client_hourlyRate')
      .addSelect('client.currency', 'client_currency')
      .where('e."clientId" = :clientId::uuid', { clientId })
      .andWhere('e."clientId" IS NOT NULL')
      .andWhere(`${alias}.name IS NOT NULL`)
      // agrupamos por los selects no agregados para que Postgres no se queje
      .groupBy(
        `${alias}.name, ci.hourlyRateOverride, ci.currencyOverride, client.hourlyRate, client.currency`,
      );

    if (year) {
      const { start, end } = yearBounds(year);
      ed.andWhere('e.day BETWEEN :start AND :end', { start, end });
    }

    const rows = await ed.getRawMany<{
      name: string;
      totalSec: string;
      ci_hourlyOverride?: string | null;
      ci_currencyOverride?: string | null;
      client_hourlyRate?: string | null;
      client_currency?: string | null;
    }>();

    // 3) Procesar filas: acumular horas y costos por nombre
    const hoursByName = new Map<string, number>();
    const costsByName = new Map<string, Record<string, number>>();

    for (const r of rows) {
      const name = r.name;
      const hrs = secToHours(toNumber(r.totalSec));
      hoursByName.set(name, (hoursByName.get(name) ?? 0) + hrs);

      if (includeCost) {
        // resolver pricing por fila (override del CI > client)
        const pricing = resolveEffectivePricing({
          clientItem: {
            hourlyRateOverride: r.ci_hourlyOverride ?? null,
            currencyOverride: r.ci_currencyOverride ?? null,
          },
          client: {
            hourlyRate: r.client_hourlyRate ?? null,
            currency: r.client_currency ?? null,
          },
        });

        const cur = (pricing.currency ?? 'UNKNOWN') as string;
        const cost = Math.round(pricing.hourlyRate * hrs * 100) / 100;

        const current = costsByName.get(name) ?? {};
        current[cur] = (current[cur] ?? 0) + cost;
        costsByName.set(name, current);
      }
    }

    // 4) Construir la salida final combinando counts + hours + costs
    const items = counts.map((r) => {
      const name = r.name;
      const out: any = { name, cases: Number(r.cases) };

      if (includeHours) {
        out.hours = Math.round((hoursByName.get(name) ?? 0) * 10) / 10;
      }

      if (includeCost) {
        const costObj = costsByName.get(name) ?? {};
        const roundedCostObj = Object.fromEntries(
          Object.entries(costObj).map(([k, v]) => [
            k,
            Math.round(v * 100) / 100,
          ]),
        );
        const knownCurrencies = Object.keys(roundedCostObj).filter(
          (c) => c !== 'UNKNOWN',
        );
        const mixedCurrency = knownCurrencies.length > 1;

        out.cost = {
          costsByCurrency: roundedCostObj,
          mixedCurrency,
        };

        // si hay UNA sola moneda conocida, dejamos un atajo `raw` + `currency`
        if (!mixedCurrency && knownCurrencies.length === 1) {
          const only = knownCurrencies[0];
          out.cost.raw = roundedCostObj[only];
          out.cost.currency = only;
        } else {
          out.cost.raw = null;
          out.cost.currency = null;
        }
      }

      return out;
    });

    return { clientId, level, items };
  }

  /* --------------------------- */

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
      .where('entry.lawyerId = :lawyerId::uuid', { lawyerId })
      /* .andWhere('entry.day BETWEEN :start AND :end', {
        start: startOfYear,
        end: endOfYear,
      }) */
      .andWhere('entry.day BETWEEN :start::date AND :end::date', {
        start: startOfYear.toISOString().slice(0, 10),
        end: endOfYear.toISOString().slice(0, 10),
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
