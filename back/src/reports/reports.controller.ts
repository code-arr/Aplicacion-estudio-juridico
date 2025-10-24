import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /**
   * GET /reports/client-cost-summary
   * Params (query):
   *  - lawyerId: string (requerido)
   *  - clientId: string (requerido)
   *  - year: number (requerido)
   *  - month: number (1..12) (opcional => si no viene, se toma el año completo)
   *  - logoUrl: string (opcional)
   */
  @Get('client-cost-summary')
  @Header('Content-Type', 'application/pdf')
  async clientCostSummary(
    @Res() res: Response,
    @Query('lawyerId') lawyerId: string,
    @Query('clientId') clientId: string,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
    @Query('logoUrl') logoUrl?: string,
  ) {
    // Validaciones mínimas
    if (!lawyerId || !clientId) {
      throw new BadRequestException('lawyerId y clientId son requeridos');
    }
    const year = Number(yearStr);
    if (!year || Number.isNaN(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('year inválido o faltante');
    }
    const month = monthStr ? Number(monthStr) : undefined;
    if (month != null && (month < 1 || month > 12)) {
      throw new BadRequestException('month debe estar entre 1 y 12');
    }

    // construir el stream del PDF
    const { filename, doc } = await this.reports.buildClientCostSummaryPdf({
      lawyerId,
      clientId,
      year,
      month,
      logoUrl,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    doc.end(); // cerrar el stream
  }
}
