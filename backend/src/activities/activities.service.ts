import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { CreateExecutionDto } from './dto/create-execution.dto.js';

interface SubactivityWithTargets {
  id: string;
  name: string;
  targets: { target: number; isLocked: boolean }[];
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Activities ─────────────────────────────────────────────────────────────

  async findAllByProcess(
    processId: string,
    year: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { processId, year },
        include: { photos: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where: { processId, year } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad '${id}' no encontrada`);
    }

    return activity;
  }

  async create(dto: CreateActivityDto) {
    const date = new Date(dto.date);
    const year = date.getFullYear();

    // Verificar que el proceso existe
    const process = await this.prisma.process.findUnique({
      where: { id: dto.processId },
    });
    if (!process) {
      throw new BadRequestException(`Proceso '${dto.processId}' no existe`);
    }

    // Verificar que la subactividad pertenece al proceso
    const subactivity = await this.prisma.subactivity.findUnique({
      where: { id: dto.subactivityId },
    });
    if (!subactivity || subactivity.processId !== dto.processId) {
      throw new BadRequestException(
        `Subactividad '${dto.subactivityId}' no pertenece al proceso '${dto.processId}'`,
      );
    }

    return this.prisma.activity.create({
      data: {
        processId: dto.processId,
        subactivityId: dto.subactivityId,
        year,
        title: dto.title,
        description: dto.description ?? '',
        message: dto.message ?? '',
        date,
        attendees: dto.attendees,
        departments: dto.departments,
      },
      include: { photos: true },
    });
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id);

    const updateData: {
      title?: string;
      description?: string;
      message?: string;
      date?: Date;
      year?: number;
      attendees?: number;
      departments?: string[];
    } = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.message !== undefined) updateData.message = dto.message;
    if (dto.attendees !== undefined) updateData.attendees = dto.attendees;
    if (dto.departments !== undefined) updateData.departments = dto.departments;

    if (dto.date) {
      const date = new Date(dto.date);
      updateData.date = date;
      updateData.year = date.getFullYear();
    }

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
      include: { photos: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });
  }

  // ─── Executions ─────────────────────────────────────────────────────────────

  async createExecution(subactivityId: string, dto: CreateExecutionDto) {
    const subactivity = await this.prisma.subactivity.findUnique({
      where: { id: subactivityId },
    });

    if (!subactivity) {
      throw new NotFoundException(`Subactividad '${subactivityId}' no encontrada`);
    }

    const date = new Date(dto.date);
    const year = date.getFullYear();

    return this.prisma.execution.create({
      data: {
        subactivityId,
        year,
        date,
        count: dto.count ?? 1,
      },
    });
  }

  async findExecutionsBySubactivity(subactivityId: string, year: number) {
    const subactivity = await this.prisma.subactivity.findUnique({
      where: { id: subactivityId },
    });

    if (!subactivity) {
      throw new NotFoundException(`Subactividad '${subactivityId}' no encontrada`);
    }

    return this.prisma.execution.findMany({
      where: { subactivityId, year },
      orderBy: { date: 'desc' },
    });
  }

  async removeExecution(executionId: string): Promise<void> {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new NotFoundException(`Ejecución '${executionId}' no encontrada`);
    }

    await this.prisma.execution.delete({ where: { id: executionId } });
  }

  // ─── Annual Targets ──────────────────────────────────────────────────────────

  async findTargetsByProcess(processId: string, year: number) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        subactivities: {
          include: {
            targets: { where: { year } },
          },
        },
      },
    });

    if (!process) {
      throw new NotFoundException(`Proceso '${processId}' no encontrado`);
    }

    return (process.subactivities as SubactivityWithTargets[]).map((s) => ({
      subactivityId: s.id,
      subactivityName: s.name,
      target: s.targets[0]?.target ?? null,
      isLocked: s.targets[0]?.isLocked ?? false,
      year,
    }));
  }

  async upsertTarget(
    subactivityId: string,
    year: number,
    target: number,
  ) {
    const existing = await this.prisma.annualTarget.findUnique({
      where: { subactivityId_year: { subactivityId, year } },
    });

    if (existing?.isLocked) {
      throw new ConflictException(
        `La meta de la subactividad '${subactivityId}' para ${year} ya está bloqueada y no puede modificarse`,
      );
    }

    return this.prisma.annualTarget.upsert({
      where: { subactivityId_year: { subactivityId, year } },
      update: { target },
      create: { subactivityId, year, target, isLocked: false },
    });
  }

  async lockTarget(subactivityId: string, year: number) {
    const existing = await this.prisma.annualTarget.findUnique({
      where: { subactivityId_year: { subactivityId, year } },
    });

    if (!existing) {
      throw new NotFoundException(
        `No existe meta para la subactividad '${subactivityId}' en ${year}`,
      );
    }

    return this.prisma.annualTarget.update({
      where: { subactivityId_year: { subactivityId, year } },
      data: { isLocked: true },
    });
  }

  // ─── Crear subactividades dinámicamente ─────────────────────────────────────

  async createSubactivityWithTarget(
    processId: string,
    name: string,
    year: number,
    target: number,
  ) {
    const process = await this.prisma.process.findUnique({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Proceso '${processId}' no encontrado`);
    }

    const id = randomUUID();
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sub = await tx.subactivity.create({ data: { id, processId, name } });
      await tx.annualTarget.create({ data: { subactivityId: id, year, target, isLocked: false } });
      return sub;
    });
  }

  async createGlobalSubactivityWithTarget(name: string, year: number, target: number) {
    const processes = await this.prisma.process.findMany({ select: { id: true } });

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const proc of processes) {
        const id = randomUUID();
        await tx.subactivity.create({ data: { id, processId: proc.id, name } });
        await tx.annualTarget.create({ data: { subactivityId: id, year, target, isLocked: false } });
      }
    });
  }

  async deleteSubactivity(id: string): Promise<void> {
    const sub = await this.prisma.subactivity.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subactividad '${id}' no encontrada`);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Borrar fotos de actividades asociadas
      const activities = await tx.activity.findMany({ where: { subactivityId: id }, select: { id: true } });
      for (const act of activities) {
        await tx.activityPhoto.deleteMany({ where: { activityId: act.id } });
      }
      await tx.activity.deleteMany({ where: { subactivityId: id } });
      await tx.execution.deleteMany({ where: { subactivityId: id } });
      await tx.annualTarget.deleteMany({ where: { subactivityId: id } });
      await tx.historicalPercentageSubactivity.deleteMany({ where: { subactivityId: id } });
      await tx.subactivity.delete({ where: { id } });
    });
  }
}
