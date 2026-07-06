import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { UpdateAbsenceDto } from './dto/update-absence.dto.js';

export interface Cie10Result {
  code: string;
  title: string;
}

@Injectable()
export class AbsenceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateAbsenceDto) {
    // Validar que el proceso existe y es de tipo AUSENTISMO
    const process = await this.prisma.process.findUnique({
      where: { id: dto.processId },
    });

    if (!process) {
      throw new BadRequestException(`Proceso '${dto.processId}' no existe`);
    }

    if (process.type !== 'AUSENTISMO') {
      throw new BadRequestException(
        `El proceso '${dto.processId}' no es de tipo AUSENTISMO`,
      );
    }

    // Calcular días (ambos inclusive)
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    if (days < 1) {
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
    }

    // Año derivado de startDate
    const year = start.getFullYear();

    return this.prisma.absenceRecord.create({
      data: {
        processId: dto.processId,
        identification: dto.identification,
        employeeName: dto.employeeName,
        requestDate: new Date(dto.requestDate),
        startDate: start,
        endDate: end,
        days,
        incapacityType: dto.incapacityType,
        department: dto.department,
        diagnosticCode: dto.diagnosticCode,
        diagnosticConcept: dto.diagnosticConcept,
        year,
      },
    });
  }

  // ─── Find by process ─────────────────────────────────────────────────────────

  async findByProcess(processId: string, year: number) {
    return this.prisma.absenceRecord.findMany({
      where: { processId, year },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.absenceRecord.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException(`Registro de ausencia '${id}' no encontrado`);
    }

    return record;
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateAbsenceDto) {
    const existing = await this.findOne(id);

    const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    if (days < 1) {
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
    }

    const updateData: {
      identification?: string;
      employeeName?: string;
      requestDate?: Date;
      startDate?: Date;
      endDate?: Date;
      days?: number;
      year?: number;
      incapacityType?: string;
      department?: string;
      diagnosticCode?: string | null;
      diagnosticConcept?: string | null;
    } = {};

    if (dto.identification !== undefined) updateData.identification = dto.identification;
    if (dto.employeeName !== undefined) updateData.employeeName = dto.employeeName;
    if (dto.requestDate !== undefined) updateData.requestDate = new Date(dto.requestDate);
    if (dto.incapacityType !== undefined) updateData.incapacityType = dto.incapacityType;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.diagnosticCode !== undefined) updateData.diagnosticCode = dto.diagnosticCode ?? null;
    if (dto.diagnosticConcept !== undefined) updateData.diagnosticConcept = dto.diagnosticConcept ?? null;

    if (dto.startDate || dto.endDate) {
      updateData.startDate = start;
      updateData.endDate = end;
      updateData.days = days;
      updateData.year = start.getFullYear();
    }

    return this.prisma.absenceRecord.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── Remove ─────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.absenceRecord.delete({ where: { id } });
  }

  // ─── Employee search ────────────────────────────────────────────────────────

  async searchEmployees(q: string): Promise<{ identification: string; employeeName: string }[]> {
    if (!q || q.length < 2) return [];
    return this.prisma.absenceRecord.findMany({
      where: {
        OR: [
          { identification: { contains: q, mode: 'insensitive' } },
          { employeeName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { identification: true, employeeName: true },
      distinct: ['identification', 'employeeName'],
      orderBy: [{ identification: 'asc' }, { employeeName: 'asc' }],
      take: 10,
    });
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getStats(processId: string, period: string) {
    const VALID_PERIODS = ['semanal', 'mensual', 'trimestral', 'anual'] as const;
    if (!VALID_PERIODS.includes(period as (typeof VALID_PERIODS)[number])) {
      throw new BadRequestException(
        `El período '${period}' no es válido. Use: semanal, mensual, trimestral o anual`,
      );
    }

    // Las fechas se guardan como @db.Date (medianoche UTC). Calculamos los
    // límites del período en UTC para que la comparación no dependa de la
    // zona horaria del servidor (mismo bug que afectaba al frontend).
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    let from: Date;

    if (period === 'semanal') {
      from = new Date(today);
      from.setUTCDate(today.getUTCDate() - 7);
      from.setUTCHours(0, 0, 0, 0);
    } else if (period === 'mensual') {
      from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    } else if (period === 'trimestral') {
      from = new Date(today);
      from.setUTCMonth(today.getUTCMonth() - 3);
      from.setUTCHours(0, 0, 0, 0);
    } else {
      // anual
      from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    }

    const records = await this.prisma.absenceRecord.findMany({
      where: {
        processId,
        startDate: { gte: from, lte: today },
      },
    });

    // Summary
    const totalCases = records.length;
    const totalDays = records.reduce((sum, r) => sum + r.days, 0);

    // By department
    const deptMap = new Map<string, { cases: number; days: number }>();
    for (const r of records) {
      const entry = deptMap.get(r.department) ?? { cases: 0, days: 0 };
      entry.cases += 1;
      entry.days += r.days;
      deptMap.set(r.department, entry);
    }
    const byDepartment = Array.from(deptMap.entries())
      .map(([department, v]) => ({ department, cases: v.cases, days: v.days }))
      .sort((a, b) => b.cases - a.cases);

    // By start weekday
    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekdayMap = new Map<number, number>();
    for (const r of records) {
      const dayIndex = r.startDate.getUTCDay();
      weekdayMap.set(dayIndex, (weekdayMap.get(dayIndex) ?? 0) + 1);
    }
    const byStartWeekday = Array.from(weekdayMap.entries())
      .map(([dayIndex, cases]) => ({ weekday: WEEKDAYS[dayIndex], dayIndex, cases }))
      .sort((a, b) => b.cases - a.cases);

    // Top concepts
    const conceptKey = (r: { diagnosticCode: string | null; diagnosticConcept: string | null }) =>
      `${r.diagnosticCode ?? ''}||${r.diagnosticConcept ?? ''}`;
    const conceptMap = new Map<string, { diagnosticCode: string | null; diagnosticConcept: string | null; cases: number }>();
    for (const r of records) {
      const key = conceptKey(r);
      const entry = conceptMap.get(key) ?? {
        diagnosticCode: r.diagnosticCode,
        diagnosticConcept: r.diagnosticConcept,
        cases: 0,
      };
      entry.cases += 1;
      conceptMap.set(key, entry);
    }
    const topConcepts = Array.from(conceptMap.values())
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10);

    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    return {
      period,
      dateRange: { from: toDateStr(from), to: toDateStr(today) },
      summary: { totalCases, totalDays },
      byDepartment,
      byStartWeekday,
      topConcepts,
    };
  }

  // ─── Person stats ────────────────────────────────────────────────────────────

  async getPersonStats(identification: string, processId: string) {
    const currentYear = new Date().getFullYear();

    const records = await this.prisma.absenceRecord.findMany({
      where: { identification, processId, year: currentYear },
      orderBy: { startDate: 'desc' },
    });

    if (records.length === 0) {
      throw new NotFoundException(
        'No se encontraron registros para esta persona en el año actual',
      );
    }

    const currentYearCases = records.length;
    const currentYearDays = records.reduce((sum, r) => sum + r.days, 0);

    // Use the most recent record for identifying info
    const latest = records[0];

    // By start weekday
    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekdayMap = new Map<number, number>();
    for (const r of records) {
      const dayIndex = r.startDate.getUTCDay();
      weekdayMap.set(dayIndex, (weekdayMap.get(dayIndex) ?? 0) + 1);
    }
    const byStartWeekday = Array.from(weekdayMap.entries())
      .map(([dayIndex, cases]) => ({ weekday: WEEKDAYS[dayIndex], dayIndex, cases }))
      .sort((a, b) => b.cases - a.cases);

    // By diagnostic
    const conceptKey = (r: { diagnosticCode: string | null; diagnosticConcept: string | null }) =>
      `${r.diagnosticCode ?? ''}||${r.diagnosticConcept ?? ''}`;
    const diagMap = new Map<string, { diagnosticCode: string | null; diagnosticConcept: string | null; cases: number }>();
    for (const r of records) {
      const key = conceptKey(r);
      const entry = diagMap.get(key) ?? {
        diagnosticCode: r.diagnosticCode,
        diagnosticConcept: r.diagnosticConcept,
        cases: 0,
      };
      entry.cases += 1;
      diagMap.set(key, entry);
    }
    const byDiagnostic = Array.from(diagMap.values()).sort((a, b) => b.cases - a.cases);

    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    const absences = records.map((r) => ({
      id: r.id,
      startDate: toDateStr(r.startDate),
      endDate: toDateStr(r.endDate),
      requestDate: toDateStr(r.requestDate),
      days: r.days,
      incapacityType: r.incapacityType,
      diagnosticCode: r.diagnosticCode,
      diagnosticConcept: r.diagnosticConcept,
    }));

    return {
      identification: latest.identification,
      employeeName: latest.employeeName,
      department: latest.department,
      currentYearCases,
      currentYearDays,
      byStartWeekday,
      byDiagnostic,
      absences,
    };
  }

  // ─── CIE-10 search (catálogo local BD) ──────────────────────────────────────
  // Busca por código (startsWith) y por descripción (contains) en paralelo,
  // priorizando coincidencias exactas de código.

  async searchCie10(q: string): Promise<Cie10Result[]> {
    if (!q || q.trim().length < 1) return [];

    const trimmed = q.trim();
    const query = trimmed.toUpperCase();
    // Un código CIE-10 empieza con letra seguida de dígito (A00, E10, J18…)
    const looksLikeCode = /^[A-Z][0-9]/.test(query);

    const byCode = await this.prisma.cie10Code.findMany({
      where: { code: { startsWith: query } },
      orderBy: { code: 'asc' },
      take: 10,
    });

    if (looksLikeCode || byCode.length >= 10) {
      return byCode.map((r) => ({ code: r.code, title: r.description }));
    }

    // Solo cuando no parece código y hay pocas coincidencias: completar con descripción
    const byDesc = await this.prisma.cie10Code.findMany({
      where: { description: { contains: trimmed, mode: 'insensitive' } },
      orderBy: { code: 'asc' },
      take: 10,
    });

    const seen = new Set<string>(byCode.map((r) => r.code));
    const results = byCode.map((r) => ({ code: r.code, title: r.description }));
    for (const row of byDesc) {
      if (!seen.has(row.code)) {
        seen.add(row.code);
        results.push({ code: row.code, title: row.description });
      }
      if (results.length >= 10) break;
    }
    return results;
  }
}
