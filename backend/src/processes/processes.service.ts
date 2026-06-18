import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ProcessWithRelations = {
  id: string;
  name: string;
  description: string;
  provinceId: string;
  subactivities: Array<{
    id: string;
    name: string;
    targets: Array<{ target: number; isLocked: boolean }>;
    executions: Array<{ count: number }>;
  }>;
  historicalPercentages: Array<{ year: number; percentage: number }>;
};

export interface ProcessSummary {
  id: string;
  name: string;
  description: string;
  provinceId: string;
  progress: number;
  executedTotal: number;
  targetTotal: number;
  subactivities: SubactivitySummary[];
  historicalPercentages: { year: number; percentage: number }[];
}

export interface SubactivitySummary {
  id: string;
  name: string;
  executed: number;
  target: number;
  isLocked: boolean;
  progress: number;
}

@Injectable()
export class ProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(year: number): Promise<ProcessSummary[]> {
    const processes = await this.prisma.process.findMany({
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
            executions: {
              where: { year },
              select: { count: true },
            },
          },
        },
        historicalPercentages: {
          orderBy: { year: 'asc' },
          select: { year: true, percentage: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return (processes as ProcessWithRelations[]).map((p) =>
      this.mapProcessSummary(p, year),
    );
  }

  async findOne(id: string, year: number): Promise<ProcessSummary> {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
            executions: {
              where: { year },
              select: { count: true },
            },
          },
        },
        historicalPercentages: {
          orderBy: { year: 'asc' },
          select: { year: true, percentage: true },
        },
      },
    });

    if (!process) {
      throw new NotFoundException(`Proceso '${id}' no encontrado`);
    }

    return this.mapProcessSummary(process as ProcessWithRelations, year);
  }

  async findByProvinceId(provinceId: string, year: number): Promise<ProcessSummary> {
    const process = await this.prisma.process.findUnique({
      where: { provinceId },
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
            executions: {
              where: { year },
              select: { count: true },
            },
          },
        },
        historicalPercentages: {
          orderBy: { year: 'asc' },
          select: { year: true, percentage: true },
        },
      },
    });

    if (!process) {
      throw new NotFoundException(`No existe proceso para la provincia '${provinceId}'`);
    }

    return this.mapProcessSummary(process as ProcessWithRelations, year);
  }

  private mapProcessSummary(
    process: ProcessWithRelations,
    _year: number,
  ): ProcessSummary {
    const subactivities: SubactivitySummary[] = process.subactivities
      .filter((s) => s.targets.length > 0)
      .map((s) => {
        const tgt = s.targets[0];
        const target = tgt.target;
        const isLocked = tgt.isLocked;
        const executed = s.executions.reduce((sum, e) => sum + e.count, 0);
        const progress = target > 0 ? Math.round((executed / target) * 100) : 0;
        return { id: s.id, name: s.name, executed, target, isLocked, progress };
      });

    const executedTotal = subactivities.reduce((sum, s) => sum + s.executed, 0);
    const targetTotal = subactivities.reduce((sum, s) => sum + s.target, 0);
    const progress = targetTotal > 0 ? Math.round((executedTotal / targetTotal) * 100) : 0;

    return {
      id: process.id,
      name: process.name,
      description: process.description,
      provinceId: process.provinceId,
      progress,
      executedTotal,
      targetTotal,
      subactivities,
      historicalPercentages: process.historicalPercentages,
    };
  }
}
