import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ProcessWithRelations = {
  id: string;
  name: string;
  description: string;
  provinceId: string;
  type: string;
  subactivities: Array<{
    id: string;
    name: string;
    isFixed: boolean;
    targets: Array<{ target: number; isLocked: boolean }>;
    executions: Array<{ count: number }>;
  }>;
  historicalPercentages: Array<{ year: number; percentage: number }>;
};

type ProcessDetailWithRelations = {
  id: string;
  name: string;
  description: string;
  provinceId: string;
  type: string;
  subactivities: Array<{
    id: string;
    name: string;
    isFixed: boolean;
    targets: Array<{ target: number; isLocked: boolean }>;
    executions: Array<{ date: Date; count: number }>;
  }>;
  activities: Array<{
    id: string;
    subactivityId: string;
    title: string;
    description: string;
    message: string;
    date: Date;
    attendees: number;
    departments: string[];
    photos: Array<{ url: string }>;
  }>;
  historicalPercentages: Array<{ year: number; percentage: number }>;
};

export interface ProcessSummary {
  id: string;
  name: string;
  description: string;
  provinceId: string;
  type: string;
  progress: number;
  executedTotal: number;
  targetTotal: number;
  subactivities: SubactivitySummary[];
  historicalPercentages: { year: number; percentage: number }[];
}

export interface SubactivitySummary {
  id: string;
  name: string;
  isFixed: boolean;
  executed: number;
  target: number;
  isLocked: boolean;
  progress: number;
}

export interface ProcessDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  subactivities: {
    id: string;
    name: string;
    isFixed: boolean;
    annualTarget: number;
    target: number;
    isLocked: boolean;
    executions: { date: string; count: number }[];
  }[];
  activities: {
    id: string;
    subactivityId: string;
    title: string;
    description: string;
    message: string;
    date: string;
    attendees: number;
    departments: string[];
    photos: string[];
  }[];
  historicalPercentages: { year: number; percentage: number }[];
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

  async findOne(id: string, year: number): Promise<ProcessDetail> {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
            executions: {
              where: { year },
              select: { date: true, count: true },
            },
          },
        },
        activities: {
          where: { year },
          orderBy: { date: 'asc' },
          include: {
            photos: { select: { url: true } },
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

    return this.mapProcessDetail(process as ProcessDetailWithRelations);
  }

  async findByProvinceId(provinceId: string, year: number): Promise<ProcessDetail> {
    const process = await this.prisma.process.findUnique({
      where: { provinceId },
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
            executions: {
              where: { year },
              select: { date: true, count: true },
            },
          },
        },
        activities: {
          where: { year },
          orderBy: { date: 'asc' },
          include: {
            photos: { select: { url: true } },
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

    return this.mapProcessDetail(process as ProcessDetailWithRelations);
  }

  private mapProcessDetail(process: ProcessDetailWithRelations): ProcessDetail {
    return {
      id: process.id,
      name: process.name,
      description: process.description,
      type: process.type,
      subactivities: process.subactivities.map((s) => ({
        id: s.id,
        name: s.name,
        isFixed: s.isFixed,
        annualTarget: s.targets[0]?.target ?? 0,
        target: s.targets[0]?.target ?? 0,
        isLocked: s.targets[0]?.isLocked ?? false,
        executions: s.executions.map((e) => ({
          date: e.date instanceof Date
            ? e.date.toISOString().split('T')[0]
            : String(e.date).split('T')[0],
          count: e.count,
        })),
      })),
      activities: process.activities.map((a) => ({
        id: a.id,
        subactivityId: a.subactivityId,
        title: a.title,
        description: a.description,
        message: a.message,
        date: a.date instanceof Date
          ? a.date.toISOString().split('T')[0]
          : String(a.date).split('T')[0],
        attendees: a.attendees,
        departments: a.departments,
        photos: a.photos.map((p) => p.url),
      })),
      historicalPercentages: process.historicalPercentages,
    };
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
        return { id: s.id, name: s.name, isFixed: s.isFixed, executed, target, isLocked, progress };
      });

    const executedTotal = subactivities.reduce((sum, s) => sum + s.executed, 0);
    const targetTotal = subactivities.reduce((sum, s) => sum + s.target, 0);
    const progress = targetTotal > 0 ? Math.round((executedTotal / targetTotal) * 100) : 0;

    return {
      id: process.id,
      name: process.name,
      description: process.description,
      provinceId: process.provinceId,
      type: process.type,
      progress,
      executedTotal,
      targetTotal,
      subactivities,
      historicalPercentages: process.historicalPercentages,
    };
  }
}
