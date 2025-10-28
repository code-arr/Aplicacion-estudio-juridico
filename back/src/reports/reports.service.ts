// File: src/services/reports.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument = require('pdfkit');
import axios from 'axios';
import { Repository, In, Between } from 'typeorm';

// Asumimos que los tipos GroupedClientDetail y TaskDetail están exportados aquí:
import { EntryDayRepository } from 'src/repositories/entryDay.repository';
import { Client, Currency } from 'src/entities/client.entity';
import { ClientItem } from 'src/entities/clientItem.entity';
import { Lawyer } from 'src/entities/lawyer.entity';
import { EntryDay } from 'src/entities/entryDay.entity';

// ===========================================
// === INTERFACES DE TIPOS ===
// ===========================================
type TaskDetail = {
  day: string; // Formato YYYY-MM-DD
  description: string;
  durationSec: number;
  trackableId: string | null;
  lawyerId: string; // ID del abogado
  lawyerName: string; // Nombre completo del abogado
};

type GroupedClientDetail = {
  clientItemId: string | null;
  clientName: string | null;
  types: Record<string, number>;
  totalByMonth: number;
  tasks: TaskDetail[]; // Lista de tareas granulares (con info del abogado)
};
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
    // Importante: Asegúrate que EntryDayRepository tenga el método getClientDetailByMonth
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

  /** -----------------------------------------
   * Generación del PDF
   * ---------------------------------------- */

  async buildClientCostSummaryPdf(opts: BuildOpts) {
    const { lawyerId, clientId, year, month, logoUrl } = opts;

    // === Datos base ===
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
      // Mantenemos esta consulta aunque ya no se use para la tabla de profesionales
      this.lawyerRepo.findOne({
        where: { id: lawyerId },
        select: ['id', 'firstName', 'lastName'],
      }),
    ]);

    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (!month) throw new Error('month is required');

    // === Detalle mensual: Llama al repositorio para obtener todos los proyectos y sus tareas ===
    const clientItems: GroupedClientDetail[] =
      await this.entryRepo.getClientDetailByMonth(
        lawyerId,
        Number(month),
        year,
      );

    const clientItemsWithTasks = clientItems;
    const allTasksFlat = clientItems.flatMap((item) => item.tasks);

    // =========================================================================
    // === LÓGICA CLAVE: CALCULAR HORAS POR PROFESIONAL PARA LA TABLA NUEVA ===
    // =========================================================================
    const professionalTotals = allTasksFlat.reduce(
      (acc, task) => {
        if (task.lawyerId) {
          if (!acc[task.lawyerId]) {
            acc[task.lawyerId] = {
              name: task.lawyerName,
              totalHours: 0,
            };
          }
          acc[task.lawyerId].totalHours += task.durationSec / 3600;
        }
        return acc;
      },
      {} as Record<string, { name: string; totalHours: number }>,
    );

    const participatingProfessionals = Object.values(professionalTotals);
    // =========================================================================

    // Calcular el total de horas (sumando todos los proyectos)
    const totalMonthHours = clientItems.reduce(
      (sum, e) => sum + (e.totalByMonth ?? 0),
      0,
    );

    const rate = Number(client.hourlyRate) || 0;
    const currency = client.currency ?? Currency.CLP;
    const totalEstimated = rate ? totalMonthHours * rate : 0;

    const [totalCases, openCases, closedCases] =
      await this.getVeryLightCasesStats(clientId);

    // === PDF ===
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const rightAlignX = doc.page.width - doc.page.margins.right;
    const PROJECT_COL_FACTURABLE_X = 350;
    const PROJECT_COL_TARIFICADO_X = 450;

    // === Header ===
    await this.drawHeader(doc, logoUrl);

    // === Título y periodo ===
    doc
      .moveDown(1)
      .font(this.fontBold())
      .fontSize(18)
      .text('Liquidación de Honorarios', { align: 'center', width: pageWidth });
    doc
      .moveDown(0.3)
      .font(this.fontRegular())
      .fontSize(11)
      .fillColor('#64748b')
      .text(this.periodoLabel(year, month), {
        align: 'center',
        width: pageWidth,
      })
      .fillColor('#0f172a');

    // === Datos del cliente ===
    doc.moveDown(1);
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

    // ===================================================
    // === Profesionales participantes (MODIFICADO) ===
    // ===================================================
    if (participatingProfessionals.length > 0) {
      doc.moveDown(0.6);
      // Título MODIFICADO: Ahora es plural
      this.drawSectionTitle(doc, 'Profesionales a cargo', pageWidth);

      // Lista de todos los nombres
      const allNames = participatingProfessionals.map((p) => p.name).join(', ');
      this.kv(doc, 'Abogado(s) en este periodo', allNames, pageWidth);
    }

    // === Resumen ejecutivo ===
    doc.moveDown(1);
    this.drawSectionTitle(doc, 'Resumen ejecutivo', pageWidth);
    if (rate)
      this.kv(
        doc,
        'Tarifa horaria',
        this.formatMoney(rate, currency),
        pageWidth,
      );
    this.kv(
      doc,
      'Horas registradas',
      `${totalMonthHours.toFixed(1)} h`,
      pageWidth,
    );
    this.kv(
      doc,
      'Casos del cliente (total / abiertos / cerrados)',
      `${totalCases} / ${openCases} / ${closedCases}`,
      pageWidth,
    );

    // ==========================================
    // === PROYECTOS (Facturación por caso) ===
    // ==========================================
    if (clientItems.length) {
      doc.moveDown(0.8);
      this.drawSectionTitle(doc, 'Proyectos / Casos', pageWidth);

      const col1X = doc.page.margins.left;
      const col2X = PROJECT_COL_FACTURABLE_X;
      const col3X = PROJECT_COL_TARIFICADO_X;

      // Encabezados de la tabla (simulados)
      const headerYProyectos = doc.y;
      doc
        .font(this.fontBold())
        .fontSize(10)
        .text('NOMBRE', col1X, headerYProyectos)
        .text('FACTURABLE', col2X, headerYProyectos)
        .text('TARIFICADO', col3X, headerYProyectos, { align: 'right' });

      doc.y = headerYProyectos + 12;

      doc.moveDown(0.2); // Línea separadora
      doc
        .moveTo(col1X, doc.y)
        .lineTo(rightAlignX, doc.y)
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.3);

      clientItems.forEach((item) => {
        const isExtras = !item.clientItemId;
        const itemName = isExtras
          ? 'Extras (ordenar documentos, tareas varias)'
          : item.clientName;
        const itemTotal = item.totalByMonth;
        const itemValue = rate ? itemTotal * rate : 0;

        doc.font(this.fontRegular()).fontSize(11).fillColor('#0f172a');
        const startY = doc.y;

        doc.text(itemName, col1X, startY, {
          width: col2X - col1X - 5,
        });

        doc.text(this.formatHours(itemTotal), col2X, startY);

        doc.text(this.formatMoney(itemValue, currency), col3X, startY, {
          align: 'right',
          width: rightAlignX - col3X,
        });

        doc.y = Math.max(doc.y, startY + 12);

        // Línea separadora después de cada caso
        doc
          .moveTo(col1X, doc.y)
          .lineTo(rightAlignX, doc.y)
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.3);
      });

      // Fila de Total para Proyectos
      const totalYProyectos = doc.y;

      doc
        .font(this.fontBold())
        .fontSize(11)
        .text('TOTAL', col1X, totalYProyectos)
        .text(this.formatHours(totalMonthHours), col2X, totalYProyectos)
        .text(
          this.formatMoney(totalEstimated, currency),
          col3X,
          totalYProyectos,
          {
            align: 'right',
            width: rightAlignX - col3X,
          },
        );

      doc.y = totalYProyectos + 18;
      doc.x = doc.page.margins.left;
      doc.moveDown(0.4);

      // Línea separadora FINAL
      doc
        .moveTo(col1X, doc.y)
        .lineTo(rightAlignX, doc.y)
        .strokeColor('#0f172a')
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.8);
    }

    // ===========================================================
    // === PROFESIONALES (Tabla por abogado) - CÓDIGO CORREGIDO ===
    // ===========================================================

    if (participatingProfessionals.length > 0) {
      doc.moveDown(0.8);
      this.drawSectionTitle(doc, 'Resumen por Profesional', pageWidth);

      const col1X = doc.page.margins.left;
      const col2X = PROJECT_COL_FACTURABLE_X;
      const col3X = PROJECT_COL_TARIFICADO_X;

      // Encabezados de la tabla (simulados)
      const headerYProfesionales = doc.y;
      doc
        .font(this.fontBold())
        .fontSize(10)
        .text('NOMBRE', col1X, headerYProfesionales)
        .text('FACTURABLE', col2X, headerYProfesionales)
        .text('TARIFICADO', col3X, headerYProfesionales, { align: 'right' });

      doc.y = headerYProfesionales + 12;

      doc.moveDown(0.2); // Línea separadora
      doc
        .moveTo(col1X, doc.y)
        .lineTo(rightAlignX, doc.y)
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.3);

      // Fila para CADA Abogado
      participatingProfessionals.forEach((prof) => {
        const totalHours = prof.totalHours;
        const totalValue = rate ? totalHours * rate : 0;

        const startY = doc.y;
        doc.font(this.fontRegular()).fontSize(11).fillColor('#0f172a');

        // Nombre del Profesional
        doc.text(prof.name, col1X, startY, {
          width: col2X - col1X - 5,
        });

        // Horas Facturables
        doc.text(this.formatHours(totalHours), col2X, startY);

        // Valor Tarificado
        doc.text(this.formatMoney(totalValue, currency), col3X, startY, {
          align: 'right',
          width: rightAlignX - col3X,
        });

        doc.y = Math.max(doc.y, startY + 12);

        // Línea separadora después del profesional
        doc
          .moveTo(col1X, doc.y)
          .lineTo(rightAlignX, doc.y)
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.3);
      });

      // Fila de Total para Profesionales
      const totalYProfesionales = doc.y;

      doc
        .font(this.fontBold())
        .fontSize(11)
        .text('TOTAL', col1X, totalYProfesionales)
        .text(this.formatHours(totalMonthHours), col2X, totalYProfesionales)
        .text(
          this.formatMoney(totalEstimated, currency),
          col3X,
          totalYProfesionales,
          {
            align: 'right',
            width: rightAlignX - col3X,
          },
        );

      doc.y = totalYProfesionales + 18;
      doc.x = doc.page.margins.left;
      doc.moveDown(0.4);

      // Línea separadora FINAL
      doc
        .moveTo(col1X, doc.y)
        .lineTo(rightAlignX, doc.y)
        .strokeColor('#0f172a')
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.8);
    }

    // ==========================================
    // === TRABAJOS (Detalle Granular AGRUPADO) ===
    // ==========================================
    const rightAlignXTasks = doc.page.width - doc.page.margins.right;

    if (allTasksFlat.length) {
      // *** MEJORA: COMPROBACIÓN DE SALTO ANTES DE EMPEZAR LA TABLA ***
      const requiredHeightForHeader = 100;
      if (
        doc.y + requiredHeightForHeader >
        doc.page.height - doc.page.margins.bottom
      ) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      this.drawSectionTitle(doc, 'Trabajos (Detalle granular)', pageWidth);

      // Definir columnas
      const col1X = doc.page.margins.left; // FECHA (Alineado a la izquierda)
      const col2X = 120; // PROFESIONAL
      const col3X = 220; // DESCRIPCIÓN
      const col4X = PROJECT_COL_FACTURABLE_X; // FACTURABLE
      const col5X = PROJECT_COL_TARIFICADO_X; // TARIFICADO

      // Función para dibujar encabezados de Trabajos (Ahora con color fijo)
      const drawTasksHeader = (isContinuation: boolean = false) => {
        if (isContinuation) {
          this.drawSectionTitle(doc, 'Trabajos (Continuación)', pageWidth);
        }

        const headerY = doc.y;

        doc
          .font(this.fontBold())
          .fontSize(10)
          .fillColor('#0f172a')
          .text('FECHA', col1X, headerY)
          .text('PROFESIONAL', col2X, headerY) // Mantenemos esta columna
          .text('DESCRIPCIÓN', col3X, headerY)
          .text('FACTURABLE', col4X, headerY)
          .text('TARIFICADO', col5X, headerY, {
            align: 'right',
            width: rightAlignXTasks - col5X,
          });

        doc.y = headerY + 12;

        doc.moveDown(0.2); // Línea separadora
        doc
          .moveTo(col1X, doc.y)
          .lineTo(rightAlignXTasks, doc.y)
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.3);
      };

      // ----------------------------------------------------
      // INICIO DE LA ITERACIÓN AGRUPADA POR PROYECTO
      // ----------------------------------------------------

      // === DIBUJAMOS LOS ENCABEZADOS DE LA TABLA UNA SOLA VEZ AL PRINCIPIO ===
      drawTasksHeader(false);

      clientItemsWithTasks.forEach((project) => {
        const isExtras = !project.clientItemId;
        const projectName = isExtras
          ? 'EXTRAS (Tareas no asociadas a un proyecto)'
          : (project.clientName?.toUpperCase() ?? 'ERROR DE PROYECTO');

        if (project.tasks.length > 0) {
          // DIBUJAR TÍTULO DEL PROYECTO (Sub-encabezado en azul)
          // Comprobación de salto antes del título del proyecto
          if (doc.y + 40 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            doc.x = doc.page.margins.left;
            drawTasksHeader(true);

            doc.moveDown(0.3);
            doc
              .font(this.fontBold())
              .fontSize(12)
              .fillColor('#1e40af')
              .text(projectName, col1X);
            doc.moveDown(0.3);
          } else {
            // Separador visual antes del nuevo proyecto
            if (doc.y > doc.page.margins.top + 100) {
              doc.moveDown(0.5);
            }
            doc
              .font(this.fontBold())
              .fontSize(12)
              .fillColor('#1e40af')
              .text(projectName, col1X);
            doc.moveDown(0.3);
          }

          // DIBUJAR LAS TAREAS DEL PROYECTO
          project.tasks.forEach((task) => {
            const taskHours = task.durationSec / 3600;
            const taskValue = rate ? taskHours * rate : 0;
            const taskHoursFormatted = this.formatHours(taskHours);

            const taskWidth = col4X - col3X - 5;
            let startY = doc.y;

            const descHeight = doc.heightOfString(task.description, {
              width: taskWidth,
            });
            const requiredHeight = descHeight + 4;

            // === GESTIÓN DE SALTO DE PÁGINA DENTRO DEL PROYECTO ===
            const marginBelowFooter = 60;
            if (
              startY + requiredHeight + marginBelowFooter >
              doc.page.height - doc.page.margins.bottom
            ) {
              doc.addPage();
              doc.x = doc.page.margins.left;
              drawTasksHeader(true);
              doc.moveDown(0.3);
              doc
                .font(this.fontBold())
                .fontSize(12)
                .fillColor('#1e40af')
                .text(projectName, col1X);
              doc.moveDown(0.3);
              startY = doc.y;
            }
            // === Fin GESTIÓN DE SALTO DE PÁGINA ===

            // Draw the task row
            doc.font(this.fontRegular()).fontSize(10).fillColor('#0f172a');

            // Fecha
            doc.text(task.day, col1X, startY, { width: col2X - col1X - 5 });
            // Profesional - Usamos task.lawyerName
            doc.text(task.lawyerName, col2X, startY, {
              width: col3X - col2X - 5,
            });
            // Descripción
            doc.text(task.description, col3X, startY, { width: taskWidth });
            // Facturable (Horas)
            doc.text(taskHoursFormatted, col4X, startY, {
              align: 'left',
              width: col5X - col4X - 5,
            });
            // Tarificado (Valor)
            doc.text(
              this.formatMoney(taskValue, currency, { decimals: 2 }),
              col5X,
              startY,
              {
                align: 'right',
                width: rightAlignXTasks - col5X,
              },
            );
            // Mover el cursor
            doc.y = startY + requiredHeight;

            // Línea separadora FINA para la fila
            doc
              .moveTo(col1X, doc.y)
              .lineTo(rightAlignXTasks, doc.y)
              .strokeColor('#f1f5f9')
              .lineWidth(0.5)
              .stroke();
            doc.moveDown(0.2);
          });

          // =================================================
          // === AÑADIR TOTAL POR PROYECTO (Subtotal) ===
          // =================================================

          const projectTotalHours = project.totalByMonth;
          const projectTotalValue = rate ? projectTotalHours * rate : 0;

          // Línea separadora sutil antes del total
          doc.moveDown(0.3);
          doc
            .moveTo(col3X, doc.y)
            .lineTo(rightAlignXTasks, doc.y)
            .strokeColor('#cbd5e1')
            .lineWidth(0.8)
            .stroke();
          doc.moveDown(0.2);

          const totalLabelX = col3X;

          const currentY = doc.y;

          // Etiqueta "Subtotal [Nombre del Proyecto]"
          doc.font(this.fontBold()).fontSize(10).fillColor('#0f172a');
          doc.text(`Subtotal ${projectName}:`, totalLabelX, currentY, {
            width: col4X - totalLabelX - 5,
            align: 'left',
          });

          // Horas del Subtotal
          doc.text(this.formatHours(projectTotalHours), col4X, currentY, {
            align: 'left',
            width: col5X - col4X - 5,
          });

          // Valor del Subtotal
          doc.text(
            this.formatMoney(projectTotalValue, currency, { decimals: 2 }),
            col5X,
            currentY,
            {
              align: 'right',
              width: rightAlignXTasks - col5X,
            },
          );

          doc.y = currentY + 12;
          doc.x = col1X;

          doc.moveDown(0.8);
        }
      });
      // ----------------------------------------------------

      // Fila de Total para Trabajos
      const totalYTrabajos = doc.y;

      doc.font(this.fontBold()).fontSize(11);
      doc.text('TOTAL GENERAL', col1X, totalYTrabajos);
      doc.text(this.formatHours(totalMonthHours), col4X, totalYTrabajos);
      doc.text(
        this.formatMoney(totalEstimated, currency, { decimals: 2 }),
        col5X,
        totalYTrabajos,
        {
          align: 'right',
          width: rightAlignXTasks - col5X,
        },
      );

      doc.y = totalYTrabajos + 14;

      doc.moveDown(0.4);

      doc
        .moveTo(col1X, doc.y)
        .lineTo(rightAlignXTasks, doc.y)
        .strokeColor('#0f172a')
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.8);
    }

    // ==========================================
    // === TOTALES (subtotal y total - SIN IMPUESTOS) ===
    // ==========================================
    const totalFinal = totalEstimated;

    // *** ASEGURAR ESPACIO PARA EL FINAL ***
    const requiredHeightForEnd = 150;
    if (
      doc.y + requiredHeightForEnd >
      doc.page.height - doc.page.margins.bottom
    ) {
      doc.addPage();
      doc.x = doc.page.margins.left;
    }

    doc.moveDown(1.5).font(this.fontRegular()).fontSize(10.5);

    const totalsX = doc.page.margins.left;
    const valueX = 410;
    const rightAlignXFooter = doc.page.width - doc.page.margins.right;

    // 1. Subtotal
    this.drawTotalRow(
      doc,
      'Subtotal:',
      this.formatMoney(totalEstimated, currency, { decimals: 2 }),
      totalsX,
      valueX,
      rightAlignXFooter,
      false,
    );

    // Línea separadora antes del Total
    doc.moveDown(0.2);
    doc
      .moveTo(totalsX, doc.y)
      .lineTo(rightAlignXFooter, doc.y)
      .strokeColor('#0f172a')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.2);

    // 2. Total
    this.drawTotalRow(
      doc,
      'Total:',
      this.formatMoney(totalFinal, currency, { decimals: 2 }),
      totalsX,
      valueX,
      rightAlignXFooter,
      true, // para negrita
    );

    // ==========================================
    // === NOTAS (Aseguradas al final) ===
    // ==========================================

    doc.moveDown(1.2);

    if (doc.y + 80 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      doc.x = doc.page.margins.left;
    }

    this.drawSectionTitle(doc, 'Notas', pageWidth);
    const notas = [
      'Este documento expresa una estimación basada en horas registradas y tarifa vigente.',
      'Los valores podrían ajustarse por gastos administrativos o tributos aplicables.',
      'El detalle granular de tareas se resguarda por razones de confidencialidad.',
    ];
    const bulletX = doc.page.margins.left + 4;
    doc.font(this.fontRegular()).fontSize(10).fillColor('#334155');
    notas.forEach((n) => {
      doc.circle(bulletX, doc.y + 6, 1.5).fill('#334155');
      doc
        .text(n, bulletX + 8, doc.y, { align: 'left', width: pageWidth - 16 })
        .moveDown(0.2);
    });

    // === Footer ===
    this.decorateFooter(doc);

    const filename = this.buildFilename(client, year, month);
    return { filename, doc };
  }

  // ==========================================
  // === MÉTODOS HELPER (Ajustes de formato) ===
  // ==========================================

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

    doc.y = afterY + 8;
    doc.x = marginLeft;
    doc.fillColor('#0f172a');
  }

  private drawSectionTitle(doc: PDFDocument, title: string, width?: number) {
    doc.x = doc.page.margins.left;

    doc.moveDown(0.4);

    doc
      .font(this.fontBold())
      .fontSize(14)
      .fillColor('#0f172a')
      .text(title, {
        align: 'left',
        width:
          width ??
          doc.page.width - doc.page.margins.left - doc.page.margins.right,
      })
      .moveDown(0.2);
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
      .moveDown(0.2);
  }

  /**
   * Dibuja una fila de total (ej. Subtotal: $100) y avanza correctamente el cursor.
   */
  private drawTotalRow(
    doc: PDFDocument,
    k: string,
    v: string,
    kX: number,
    vX: number,
    rightAlignX: number,
    bold = false,
  ) {
    const y = doc.y;

    if (bold) {
      doc.font(this.fontBold());
      doc.fontSize(12);
    } else {
      doc.font(this.fontRegular());
      doc.fontSize(10.5);
    }

    const lineHeight = (bold ? 12 : 10.5) * 1.2;

    // Descripción
    doc.text(k, kX, y, {
      align: 'left',
      width: vX - kX - 5,
    });

    // Valor
    doc.text(v, vX, y, {
      align: 'right',
      width: rightAlignX - vX,
    });

    doc.y = y + lineHeight;

    if (bold) doc.fontSize(10.5);
  }

  private decorateFooter(doc: PDFDocument) {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      const footerY = 842 - 40;
      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(56, footerY - 12)
        .lineTo(595 - 56, footerY - 12)
        .stroke();

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
   * Helpers de datos y formato
   * ---------------------------------------- */

  private async getVeryLightCasesStats(clientId: string) {
    const rows = await this.itemRepo.find({
      where: { client: { id: clientId } },
      select: ['status'],
    });

    const total = rows.length;
    const closed = rows.filter(
      (r) => String(r.status).toLowerCase() === 'closed',
    ).length;
    const open = total - closed;

    return [total, open, closed] as const;
  }

  private periodoLabel(year: number, month?: number) {
    return month
      ? `Periodo: ${this.monthNameES(month)} ${year}`
      : `Periodo: ${year} (enero a diciembre)`;
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

  /**
   * FORMATO DE MONEDA CON CÓDIGO EXPLÍCITO (CLP, USD, UF)
   */
  private formatMoney(
    amount: number,
    currency: Currency | null,
    options?: { noSymbol?: boolean; decimals?: number },
  ) {
    const cur = currency ?? Currency.CLP;
    const dec = options?.decimals ?? (cur === Currency.CLP ? 0 : 2);

    let formattedAmount: string;

    if (cur === Currency.CLP) {
      formattedAmount = amount.toLocaleString('es-CL', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
      return `${formattedAmount} CLP`;
    }

    if (cur === Currency.UF) {
      formattedAmount = amount.toLocaleString('es-CL', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
      return `UF ${formattedAmount}`;
    }

    // Para USD
    formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
    return `${formattedAmount} USD`;
  }

  private formatHours(totalHours: number): string {
    const totalMinutes = Math.round(totalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(
      2,
      '0',
    )}m`;
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
