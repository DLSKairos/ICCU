import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';

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
        diagnosticCode: dto.diagnosticCode ?? null,
        diagnosticConcept: dto.diagnosticConcept ?? null,
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
