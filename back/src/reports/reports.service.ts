import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import { Repository } from 'typeorm';

import { EntryDayRepository } from 'src/repositories/entryDay.repository';
import { Client, Currency } from 'src/entities/client.entity';
import { ClientItem } from 'src/entities/clientItem.entity';
import { Lawyer } from 'src/entities/lawyer.entity'; // si existe tu entidad de Lawyer
import { EntryDay } from 'src/entities/entryDay.entity';

type BuildOpts = {
  lawyerId: string;
  clientId: string;
  year: number;
  month?: number; // si no viene => período anual
  logoUrl?: string;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly entryDayRepoAgg: EntryDayRepository, // tu repo “agregado” con queries ya hechas

    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,

    @InjectRepository(ClientItem)
    private readonly clientItemRepo: Repository<ClientItem>,

    @InjectRepository(Lawyer)
    private readonly lawyerRepo: Repository<Lawyer>,

    @InjectRepository(EntryDay)
    private readonly entryRepo: Repository<EntryDay>,
  ) {}

  /** Punto único para generar el PDF y el nombre de archivo */
  async buildClientCostSummaryPdf(opts: BuildOpts) {
    const { lawyerId, clientId, year, month, logoUrl } = opts;

    // Datos base
    const [client, lawyer] = await Promise.all([
      this.clientRepo.findOne({
        where: { id: clientId },
        select: [
          'id',
          'type',
          'firstName',
          'lastName',
          'companyName',
          'rut',
          'email',
          'phone',
          'address',
          'hourlyRate',
          'currency',
        ],
      }),
      this.lawyerRepo.findOne({
        where: { id: lawyerId },
        select: ['id', 'firstName', 'lastName'],
      }),
    ]);

    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Resumen de costos (ya redondeado del repo)
    const summary = await this.entryRepo.getCostSummary({
      lawyerId,
      clientId,
      year,
      month,
    });

    // Conteo MUY general de casos del cliente (no listados, sólo números)
    const [totalCases, openCases, closedCases] =
      await this.getVeryLightCasesStats(clientId);

    // Documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 56, // ~2cm
      info: {
        Title: 'Resumen de honorarios',
        Author: 'Estudio Jurídico',
        Subject: 'Resumen de honorarios y horas trabajadas',
      },
    });

    // Header (logo + título + fecha)
    await this.drawHeader(doc, logoUrl);

    // Título
    doc.moveDown(1);
    doc
      .font(this.fontBold())
      .fontSize(18)
      .text('Resumen de Honorarios', { align: 'left' });

    // Periodo
    doc
      .moveDown(0.3)
      .font(this.fontRegular())
      .fontSize(11)
      .fillColor('#64748b') // slate-500
      .text(this.periodoLabel(year, month), { align: 'left' })
      .fillColor('#0f172a'); // slate-900

    // Datos del cliente (bloque formal y breve)
    doc.moveDown(1);
    this.drawSectionTitle(doc, 'Datos del cliente');
    this.kv(doc, 'Nombre / Razón social', this.formatClientName(client));
    if (client.rut) this.kv(doc, 'RUT', client.rut);
    if (client.email) this.kv(doc, 'Email', client.email);
    if (client.phone) this.kv(doc, 'Teléfono', client.phone);
    if (client.address) this.kv(doc, 'Dirección', client.address);

    // Datos del responsable (abogado)
    if (lawyer) {
      doc.moveDown(0.6);
      this.drawSectionTitle(doc, 'Responsable');
      this.kv(doc, 'Abogado/a', `${lawyer.firstName} ${lawyer.lastName}`);
    }

    // Resumen ejecutivo (sin detalles sensibles)
    doc.moveDown(1);
    this.drawSectionTitle(doc, 'Resumen ejecutivo');
    const hrs = summary.time.totalHours;
    const rate = summary.pricing.hourlyRate;
    const currency =
      summary.pricing.currency ?? client.currency ?? Currency.CLP;

    // Tarifa mostrada solo si tiene valor (> 0)
    if (rate) this.kv(doc, 'Tarifa horaria', this.formatMoney(rate, currency));

    this.kv(doc, 'Horas registradas', `${this.formatNumber(hrs, 1)} h`);
    this.kv(
      doc,
      'Casos del cliente (total/abiertos/cerrados)',
      `${totalCases} / ${openCases} / ${closedCases}`,
    );

    // Total a cobrar
    doc.moveDown(0.6);
    doc
      .font(this.fontBold())
      .fontSize(14)
      .fillColor('#0f172a')
      .text('Total estimado a facturar', { continued: true })
      .font(this.fontBold())
      .text(`  ${this.formatMoney(summary.totalCost, currency)}`, {
        align: 'left',
      });

    // Notas / aclaraciones
    doc.moveDown(1.2);
    this.drawSectionTitle(doc, 'Notas');
    const notas = [
      'Este documento expresa una estimación basada en horas registradas y tarifa vigente.',
      'Los valores podrían ajustarse por gastos administrativos o tributos aplicables.',
      'El detalle granular de tareas se resguarda por razones de confidencialidad.',
    ];
    doc.font(this.fontRegular()).fontSize(10).fillColor('#334155'); // slate-700
    notas.forEach((n) =>
      doc
        .circle(doc.x - 6, doc.y + 6, 1.5)
        .fill('#334155')
        .fillColor('#334155')
        .text(` ${n}`)
        .fillColor('#334155'),
    );
    doc.fillColor('#0f172a');

    // pie de página con numeración
    this.decorateFooter(doc);

    const filename = this.buildFilename(client, year, month);
    return { filename, doc };
  }

  /** -----------------------------------------
   * Helpers de composición / estilo PDF
   * ---------------------------------------- */

  private async drawHeader(doc: PDFDocument, logoUrl?: string) {
    const y0 = doc.y;
    if (logoUrl) {
      try {
        const res = await axios.get<ArrayBuffer>(logoUrl, {
          responseType: 'arraybuffer',
        });
        doc.image(Buffer.from(res.data), doc.x, y0, { width: 120 });
      } catch {
        // si falla cargar logo, seguimos sin logo
      }
    }
    // a la derecha, fecha de emisión
    const right = 540; // A4 width - margin aprox (595 - 56 ~ 539)
    doc
      .font(this.fontRegular())
      .fontSize(10)
      .fillColor('#64748b') // slate-500
      .text(`Emitido: ${this.formatDateES(new Date())}`, right - 160, y0, {
        width: 160,
        align: 'right',
      })
      .moveDown(1.2)
      .fillColor('#0f172a');

    // línea divisoria
    doc
      .moveDown(0.5)
      .strokeColor('#e2e8f0') // slate-200
      .lineWidth(1)
      .moveTo(56, doc.y)
      .lineTo(595 - 56, doc.y)
      .stroke()
      .moveDown(0.5);
  }

  private drawSectionTitle(doc: PDFDocument, title: string) {
    doc
      .font(this.fontBold())
      .fontSize(12)
      .fillColor('#0f172a')
      .text(title)
      .moveDown(0.2);
  }

  private kv(doc: PDFDocument, k: string, v: string) {
    const startX = doc.x;
    const width = 595 - 56 * 2;
    doc
      .font(this.fontRegular())
      .fontSize(10.5)
      .fillColor('#64748b') // key
      .text(`${k}`, startX, doc.y, { continued: true })
      .fillColor('#0f172a') // value
      .text(`: ${v}`, startX, doc.y);
    doc.moveDown(0.2);
  }

  private decorateFooter(doc: PDFDocument) {
    const range = doc.bufferedPageRange(); // { start: 0, count: N }
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = 842 - 40; // A4 height - ~1.4cm
      // línea superior
      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(56, footerY - 12)
        .lineTo(595 - 56, footerY - 12)
        .stroke();

      // numeración
      doc
        .font(this.fontRegular())
        .fontSize(9)
        .fillColor('#64748b')
        .text(`Página ${i + 1} de ${range.count}`, 56, footerY, {
          width: 595 - 56 * 2,
          align: 'right',
        });
    }
  }

  /** -----------------------------------------
   * Helpers de datos / formato
   * ---------------------------------------- */

  private async getVeryLightCasesStats(clientId: string) {
    // Conteo general de casos del cliente (sin detalles sensibles).
    const rows = await this.itemRepo.find({
      where: { client: { id: clientId } },
      select: ['status'],
    });
    const total = rows.length;
    const closed = rows.filter(
      (r: any) => r.status === 'closed' || r.status === 'CLOSED',
    ).length;
    const open = total - closed;
    return [total, open, closed] as const;
  }

  private periodoLabel(year: number, month?: number) {
    if (!month) return `Periodo: ${year} (enero a diciembre)`;
    return `Periodo: ${this.monthNameES(month)} ${year}`;
  }

  private monthNameES(m: number) {
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return months[m - 1] ?? String(m);
  }

  private formatDateES(d: Date) {
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = this.monthNameES(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd} de ${mm} de ${yyyy}`;
  }

  private buildFilename(client: Client, year: number, month?: number) {
    const friendly = this.slug(
      this.formatClientName(client).replace(/\s+/g, '_'),
    );
    const per = month ? `${year}-${String(month).padStart(2, '0')}` : `${year}`;
    return `resumen_honorarios_${friendly}_${per}.pdf`;
  }

  private formatClientName(c: Client) {
    if (c.type === 'Fisica') {
      return (
        [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'Cliente'
      );
    }
    return c.companyName || 'Cliente';
  }

  private formatNumber(n: number, dec = 0) {
    return n.toLocaleString('es-CL', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }

  private formatMoney(amount: number, currency: Currency | null) {
    const cur = currency ?? Currency.CLP;
    if (cur === Currency.CLP) {
      // $1.234.567 (sin decimales)
      const entero = Math.round(amount);
      return `$${entero.toLocaleString('es-CL')}`;
    }
    if (cur === Currency.UF) {
      // UF 1.234,56
      return `UF ${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // USD 1,600 (sin decimales)
    const entero = Math.round(amount);
    return `USD ${entero.toLocaleString('en-US')}`;
  }

  private slug(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase();
  }

  private fontRegular() {
    // usa la built-in o cambia por font file si quieres
    return 'Helvetica';
    // ejemplo con archivo: doc.font(path.join(__dirname,'fonts','Inter-Regular.ttf'))
  }
  private fontBold() {
    return 'Helvetica-Bold';
  }
}
