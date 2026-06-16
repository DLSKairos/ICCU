import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UploadService } from '../upload/upload.service.js';

export interface AnnualResetResult {
  yearClosed: number;
  historicalProcessRecords: number;
  historicalSubactivityRecords: number;
  activitiesDeleted: number;
  executionsDeleted: number;
  cloudinaryErrors: number;
}

interface SubactivityWithData {
  id: string;
  targets: { target: number }[];
  executions: { count: number }[];
}

interface ProcessWithSubactivities {
  id: string;
  subactivities: SubactivityWithData[];
}

@Injectable()
export class AnnualResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(yearToClose: number): Promise<AnnualResetResult> {
    const currentYear = new Date().getFullYear();

    if (yearToClose >= currentYear) {
      throw new BadRequestException(
        `Solo se puede cerrar un año ya finalizado. El año ${yearToClose} aún no ha concluido.`,
      );
    }

    // Verificar que no se haya hecho ya el cierre
    const existingHistorical = await this.prisma.historicalPercentage.findFirst({
      where: { year: yearToClose },
    });
    if (existingHistorical) {
      throw new BadRequestException(
        `El año ${yearToClose} ya fue cerrado anteriormente. Los registros históricos ya existen.`,
      );
    }

    // ─── FASE 1: Calcular y guardar históricos ─────────────────────────────────
    const historicalProcessRecords = await this.saveHistoricalPerProcess(yearToClose);
    const historicalSubactivityRecords =
      await this.saveHistoricalPerSubactivity(yearToClose);

    // ─── FASE 2: Borrar datos operativos en BD ────────────────────────────────
    // Primero la BD para garantizar integridad: si esto falla, Cloudinary no se toca
    const { activitiesDeleted, executionsDeleted } =
      await this.deleteOperationalData(yearToClose);

    // ─── FASE 3: Borrar fotos de Cloudinary ───────────────────────────────────
    // Ocurre DESPUÉS de confirmar que la BD fue limpiada exitosamente
    const cloudinaryErrors = await this.deleteCloudinaryPhotos(yearToClose);

    return {
      yearClosed: yearToClose,
      historicalProcessRecords,
      historicalSubactivityRecords,
      activitiesDeleted,
      executionsDeleted,
      cloudinaryErrors,
    };
  }

  private async saveHistoricalPerProcess(year: number): Promise<number> {
    const processes = (await this.prisma.process.findMany({
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
      },
    })) as ProcessWithSubactivities[];

    let count = 0;

    for (const p of processes) {
      const executedTotal = p.subactivities.reduce(
        (sum: number, s: SubactivityWithData) =>
          sum + s.executions.reduce((acc: number, e: { count: number }) => acc + e.count, 0),
        0,
      );
      const targetTotal = p.subactivities.reduce(
        (sum: number, s: SubactivityWithData) => sum + (s.targets[0]?.target ?? 0),
        0,
      );
      const percentage =
        targetTotal > 0
          ? Math.round((executedTotal / targetTotal) * 100 * 100) / 100
          : 0;

      await this.prisma.historicalPercentage.upsert({
        where: { processId_year: { processId: p.id, year } },
        update: { percentage },
        create: { processId: p.id, year, percentage },
      });
      count++;
    }

    return count;
  }

  private async saveHistoricalPerSubactivity(year: number): Promise<number> {
    const subactivities = (await this.prisma.subactivity.findMany({
      include: {
        targets: { where: { year } },
        executions: {
          where: { year },
          select: { count: true },
        },
      },
    })) as SubactivityWithData[];

    let count = 0;

    for (const s of subactivities) {
      const executed = s.executions.reduce(
        (sum: number, e: { count: number }) => sum + e.count,
        0,
      );
      const target = s.targets[0]?.target ?? 0;
      const percentage =
        target > 0 ? Math.round((executed / target) * 100 * 100) / 100 : 0;

      await this.prisma.historicalPercentageSubactivity.upsert({
        where: { subactivityId_year: { subactivityId: s.id, year } },
        update: { percentage },
        create: { subactivityId: s.id, year, percentage },
      });
      count++;
    }

    return count;
  }

  private async deleteCloudinaryPhotos(year: number): Promise<number> {
    const activities = await this.prisma.activity.findMany({
      where: { year },
      select: { id: true },
    });

    let errorCount = 0;

    for (const activity of activities) {
      try {
        await this.uploadService.removePhotosByActivity(activity.id);
      } catch {
        errorCount++;
      }
    }

    return errorCount;
  }

  private async deleteOperationalData(year: number): Promise<{
    activitiesDeleted: number;
    executionsDeleted: number;
  }> {
    const [activitiesResult, executionsResult] = await this.prisma.$transaction([
      this.prisma.activity.deleteMany({ where: { year } }),
      this.prisma.execution.deleteMany({ where: { year } }),
    ]);

    return {
      activitiesDeleted: activitiesResult.count,
      executionsDeleted: executionsResult.count,
    };
  }

  async preview(yearToClose: number): Promise<{
    activities: number;
    executions: number;
    photos: number;
    processes: number;
    subactivities: number;
  }> {
    const [activities, executions, photos] = await Promise.all([
      this.prisma.activity.count({ where: { year: yearToClose } }),
      this.prisma.execution.count({ where: { year: yearToClose } }),
      this.prisma.activityPhoto.count({
        where: { activity: { year: yearToClose } },
      }),
    ]);

    const [processes, subactivities] = await Promise.all([
      this.prisma.process.count(),
      this.prisma.subactivity.count(),
    ]);

    return { activities, executions, photos, processes, subactivities };
  }
}
