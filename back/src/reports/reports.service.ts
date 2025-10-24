import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument = require('pdfkit');
import axios from 'axios';
import { Repository } from 'typeorm';

import { EntryDayRepository } from 'src/repositories/entryDay.repository';
import { Client, Currency } from 'src/entities/client.entity';
import { ClientItem } from 'src/entities/clientItem.entity';
import { Lawyer } from 'src/entities/lawyer.entity';
import { EntryDay } from 'src/entities/entryDay.entity';

type BuildOpts = {
  lawyerId: string;
  clientId: string;
  year: number;
  month?: number;
  logoUrl?: string;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly entryRepo: EntryDayRepository,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(ClientItem)
    private readonly itemRepo: Repository<ClientItem>,
    @InjectRepository(Lawyer)
    private readonly lawyerRepo: Repository<Lawyer>,
    @InjectRepository(EntryDay)
    private readonly entryDayRepo: Repository<EntryDay>,
  ) {}

  async buildClientCostSummaryPdf(opts: BuildOpts) {
    const { lawyerId, clientId, year, month, logoUrl } = opts;

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

    const summary = await this.entryRepo.getCostSummary({
      lawyerId,
      clientId,
      year,
      month,
    });
    const [totalCases, openCases, closedCases] =
      await this.getVeryLightCasesStats(clientId);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 56,
      info: {
        Title: 'Resumen de honorarios',
        Author: 'Estudio Jurídico',
        Subject: 'Resumen de honorarios y horas trabajadas',
      },
    });
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    await this.drawHeader(doc, logoUrl);
    doc.x = doc.page.margins.left;

    // Título
    doc.moveDown(0.5);
    doc
      .font(this.fontBold())
      .fontSize(18)
      .text('Resumen de Honorarios', { align: 'left', width: pageWidth });

    // Periodo
    doc
      .moveDown(0.2)
      .font(this.fontRegular())
      .fontSize(11)
      .fillColor('#64748b')
      .text(this.periodoLabel(year, month), { align: 'left', width: pageWidth })
      .fillColor('#0f172a');

    // Datos del cliente
    doc.moveDown(0.5);
    this.drawSectionTitle(doc, 'Datos del cliente', pageWidth);
    this.kv(
      doc,
      'Nombre / Razón social',
      this.formatClientName(client),
      pageWidth,
    );
    if (client.rut) this.kv(doc, 'RUT', client.rut, pageWidth);
    if (client.email) this.kv(doc, 'Email', client.email, pageWidth);
    if (client.phone) this.kv(doc, 'Teléfono', client.phone, pageWidth);
    if (client.address) this.kv(doc, 'Dirección', client.address, pageWidth);

    // Responsable (abogado)
    if (lawyer) {
      doc.moveDown(0.3);
      this.drawSectionTitle(doc, 'Responsable', pageWidth);
      this.kv(
        doc,
        'Abogado/a',
        `${lawyer.firstName} ${lawyer.lastName}`,
        pageWidth,
      );
    }

    // Resumen ejecutivo
    doc.moveDown(0.5);
    this.drawSectionTitle(doc, 'Resumen ejecutivo', pageWidth);
    if (!opts.month) throw new Error('month is required');

    const hrs = await this.entryRepo.getTotalHoursByMonth(
      opts.lawyerId,
      opts.clientId,
      opts.month,
      opts.year,
    );
    const rate = summary.pricing.hourlyRate;
    const currency =
      summary.pricing.currency ?? client.currency ?? Currency.CLP;
    const totalEstimated = rate ? hrs * rate : 0;

    if (rate)
      this.kv(
        doc,
        'Tarifa horaria',
        this.formatMoney(rate, currency),
        pageWidth,
      );
    this.kv(doc, 'Horas registradas', `${hrs} h`, pageWidth);
    this.kv(
      doc,
      'Casos del cliente (total/abiertos/cerrados)',
      `${totalCases} / ${openCases} / ${closedCases}`,
      pageWidth,
    );

    // Total estimado
    doc.moveDown(0.3);
    doc
      .font(this.fontBold())
      .fontSize(14)
      .fillColor('#0f172a')
      .text('Total estimado a facturar', { continued: true, width: pageWidth })
      .text(
        `: ${this.formatMoney(totalEstimated, currency, { noSymbol: true })}`,
        { width: pageWidth },
      );

    // Notas / aclaraciones
    doc.moveDown(0.5);
    this.drawSectionTitle(doc, 'Notas', pageWidth);
    const notas = [
      'Este documento expresa una estimación basada en horas registradas y tarifa vigente.',
      'Los valores podrían ajustarse por gastos administrativos o tributos aplicables.',
      'El detalle granular de tareas se resguarda por razones de confidencialidad.',
    ];
    const bulletX = doc.page.margins.left + 4;
    doc.font(this.fontRegular()).fontSize(9.5).fillColor('#334155');
    notas.forEach((n) => {
      doc.circle(bulletX, doc.y + 5, 1.5).fill('#334155');
      doc
        .text(n, bulletX + 8, doc.y, { align: 'left', width: pageWidth - 16 })
        .moveDown(0.15);
    });
    doc.fillColor('#0f172a');

    // Footer
    this.decorateFooter(doc);

    const filename = this.buildFilename(client, year, month);
    return { filename, doc };
  }

  private async drawHeader(doc: PDFDocument, logoUrl?: string) {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const y0 = doc.y;

    if (logoUrl) {
      try {
        const res = await axios.get<ArrayBuffer>(logoUrl, {
          responseType: 'arraybuffer',
        });
        doc.image(Buffer.from(res.data), marginLeft, y0, { width: 120 });
      } catch {}
    }

    const fechaWidth = 160;
    const rightX = doc.page.width - marginRight - fechaWidth;
    doc
      .font(this.fontRegular())
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Emitido: ${this.formatDateES(new Date())}`, rightX, y0, {
        width: fechaWidth,
        align: 'right',
      });

    const afterY = Math.max(doc.y, y0 + 20);
    doc
      .moveTo(marginLeft, afterY)
      .lineTo(doc.page.width - marginRight, afterY)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();
    doc.y = afterY + 6;
    doc.x = marginLeft;
    doc.fillColor('#0f172a');
  }

  private drawSectionTitle(doc: PDFDocument, title: string, width?: number) {
    doc
      .font(this.fontBold())
      .fontSize(12)
      .fillColor('#0f172a')
      .text(title, {
        width:
          width ??
          doc.page.width - doc.page.margins.left - doc.page.margins.right,
      })
      .moveDown(0.15);
  }

  private kv(doc: PDFDocument, k: string, v: string, width?: number) {
    const margin = doc.page.margins.left;
    const contentWidth =
      width ?? doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc
      .font(this.fontRegular())
      .fontSize(10.5)
      .fillColor('#64748b')
      .text(k, margin, doc.y, { continued: true, width: contentWidth })
      .fillColor('#0f172a')
      .text(`: ${v}`, { width: contentWidth })
      .moveDown(0.15);
  }

  private decorateFooter(doc: PDFDocument) {
    const footerY = doc.page.height - 40;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(56, footerY - 12)
      .lineTo(doc.page.width - 56, footerY - 12)
      .stroke();
    doc
      .font(this.fontRegular())
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Página 1`, 56, footerY, {
        width: doc.page.width - 112,
        align: 'right',
      });
  }

  private async getVeryLightCasesStats(clientId: string) {
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
    if (c.type === 'Fisica')
      return (
        [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'Cliente'
      );
    return c.companyName || 'Cliente';
  }

  private formatMoney(
    amount: number,
    currency: Currency | null,
    opts?: { noSymbol?: boolean },
  ) {
    const cur = currency ?? Currency.CLP;
    if (cur === Currency.CLP)
      return opts?.noSymbol
        ? `${Math.round(amount)}`
        : `$${Math.round(amount).toLocaleString('es-CL')}`;
    if (cur === Currency.UF)
      return opts?.noSymbol
        ? `${amount.toFixed(1)}`
        : `UF ${amount.toFixed(1)}`;
    return opts?.noSymbol
      ? `${Math.round(amount)}`
      : `USD ${Math.round(amount).toLocaleString('en-US')}`;
  }

  private slug(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase();
  }

  private fontRegular() {
    return 'Helvetica';
  }
  private fontBold() {
    return 'Helvetica-Bold';
  }
}
