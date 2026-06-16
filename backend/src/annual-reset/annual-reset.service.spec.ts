import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnnualResetService } from './annual-reset.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

// Mock del año actual para controlar las validaciones
const MOCK_CURRENT_YEAR = 2026;

jest.spyOn(global, 'Date').mockImplementation(
  () =>
    ({
      getFullYear: () => MOCK_CURRENT_YEAR,
    }) as unknown as Date,
);

const mockPrisma = {
  historicalPercentage: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  historicalPercentageSubactivity: {
    upsert: jest.fn(),
  },
  process: {
    findMany: jest.fn(),
  },
  subactivity: {
    findMany: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  execution: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockUploadService = {
  removePhotosByActivity: jest.fn(),
};

describe('AnnualResetService', () => {
  let service: AnnualResetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnualResetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<AnnualResetService>(AnnualResetService);
    jest.clearAllMocks();
  });

  // ─── Helpers para configurar mocks en estado "happy path" ────────────────────

  function setupHappyPath() {
    mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
    mockPrisma.process.findMany.mockResolvedValue([]);
    mockPrisma.subactivity.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockResolvedValue([{ count: 5 }, { count: 10 }]);
    mockPrisma.activity.findMany.mockResolvedValue([]);
  }

  // ─── Validaciones previas ────────────────────────────────────────────────────

  describe('execute(yearToClose) — pre-conditions', () => {
    it('should throw BadRequestException when yearToClose equals currentYear', async () => {
      await expect(service.execute(MOCK_CURRENT_YEAR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when yearToClose is greater than currentYear', async () => {
      await expect(service.execute(MOCK_CURRENT_YEAR + 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when historical records already exist for the year', async () => {
      mockPrisma.historicalPercentage.findFirst.mockResolvedValue({
        id: 'hist-1',
        processId: 'p1',
        year: 2025,
        percentage: 85,
      });

      await expect(service.execute(2025)).rejects.toThrow(BadRequestException);

      expect(mockPrisma.process.findMany).not.toHaveBeenCalled();
    });

    it('should NOT throw when yearToClose is strictly less than currentYear and no historical exists', async () => {
      setupHappyPath();

      await expect(service.execute(2025)).resolves.toBeDefined();
    });
  });

  // ─── Orden de operaciones ─────────────────────────────────────────────────────

  describe('execute(yearToClose) — operation order', () => {
    it('should call saveHistoricalPerProcess BEFORE deleteOperationalData', async () => {
      const callOrder: string[] = [];

      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);

      mockPrisma.process.findMany.mockImplementation(async () => {
        callOrder.push('saveHistoricalPerProcess');
        return [];
      });

      mockPrisma.subactivity.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async () => {
        callOrder.push('deleteOperationalData');
        return [{ count: 0 }, { count: 0 }];
      });

      mockPrisma.activity.findMany.mockResolvedValue([]);

      await service.execute(2025);

      const histIndex = callOrder.indexOf('saveHistoricalPerProcess');
      const deleteIndex = callOrder.indexOf('deleteOperationalData');

      expect(histIndex).toBeLessThan(deleteIndex);
    });

    it('should call deleteOperationalData BEFORE deleteCloudinaryPhotos', async () => {
      const callOrder: string[] = [];

      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      mockPrisma.process.findMany.mockResolvedValue([]);
      mockPrisma.subactivity.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async () => {
        callOrder.push('deleteOperationalData');
        return [{ count: 1 }, { count: 2 }];
      });

      const activityId = 'act-1';
      mockPrisma.activity.findMany.mockImplementation(async () => {
        // Este findMany se llama en deleteCloudinaryPhotos, DESPUÉS del $transaction
        callOrder.push('deleteCloudinaryPhotos');
        return [{ id: activityId }];
      });

      mockUploadService.removePhotosByActivity.mockResolvedValue(undefined);

      await service.execute(2025);

      const deleteIndex = callOrder.indexOf('deleteOperationalData');
      const cloudinaryIndex = callOrder.indexOf('deleteCloudinaryPhotos');

      expect(deleteIndex).toBeLessThan(cloudinaryIndex);
    });
  });

  // ─── Resultado devuelto ───────────────────────────────────────────────────────

  describe('execute(yearToClose) — return value', () => {
    it('should return result with correct yearClosed', async () => {
      setupHappyPath();

      const result = await service.execute(2025);

      expect(result.yearClosed).toBe(2025);
    });

    it('should return correct activitiesDeleted and executionsDeleted from $transaction', async () => {
      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      mockPrisma.process.findMany.mockResolvedValue([]);
      mockPrisma.subactivity.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{ count: 7 }, { count: 14 }]);
      mockPrisma.activity.findMany.mockResolvedValue([]);

      const result = await service.execute(2025);

      expect(result.activitiesDeleted).toBe(7);
      expect(result.executionsDeleted).toBe(14);
    });

    it('should return historicalProcessRecords equal to number of processes', async () => {
      const processes = [
        {
          id: 'p1',
          subactivities: [
            { id: 'sub1', targets: [{ target: 100 }], executions: [{ count: 80 }] },
          ],
        },
        {
          id: 'p2',
          subactivities: [],
        },
      ];

      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      mockPrisma.process.findMany.mockResolvedValue(processes);
      mockPrisma.historicalPercentage.upsert.mockResolvedValue({});
      mockPrisma.subactivity.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 0 }]);
      mockPrisma.activity.findMany.mockResolvedValue([]);

      const result = await service.execute(2025);

      expect(result.historicalProcessRecords).toBe(2);
    });

    it('should return cloudinaryErrors = 0 when no activities exist', async () => {
      setupHappyPath();

      const result = await service.execute(2025);

      expect(result.cloudinaryErrors).toBe(0);
    });

    it('should count cloudinaryErrors when removePhotosByActivity throws', async () => {
      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      mockPrisma.process.findMany.mockResolvedValue([]);
      mockPrisma.subactivity.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{ count: 2 }, { count: 4 }]);
      mockPrisma.activity.findMany.mockResolvedValue([
        { id: 'act-1' },
        { id: 'act-2' },
      ]);

      // Ambas llamadas a Cloudinary fallan
      mockUploadService.removePhotosByActivity.mockRejectedValue(
        new Error('Cloudinary unavailable'),
      );

      const result = await service.execute(2025);

      expect(result.cloudinaryErrors).toBe(2);
    });
  });

  // ─── saveHistoricalPerProcess (indirectamente) ────────────────────────────────

  describe('saveHistoricalPerProcess — percentage calculation', () => {
    it('should persist percentage=0 when process has no targets', async () => {
      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          subactivities: [
            { id: 'sub1', targets: [], executions: [{ count: 5 }] },
          ],
        },
      ]);
      mockPrisma.historicalPercentage.upsert.mockResolvedValue({});
      mockPrisma.subactivity.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 0 }]);
      mockPrisma.activity.findMany.mockResolvedValue([]);

      await service.execute(2025);

      expect(mockPrisma.historicalPercentage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ percentage: 0 }),
        }),
      );
    });

    it('should persist correct percentage for process with targets and executions', async () => {
      mockPrisma.historicalPercentage.findFirst.mockResolvedValue(null);
      // target=100 executed=75 → 75%
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          subactivities: [
            { id: 'sub1', targets: [{ target: 100 }], executions: [{ count: 75 }] },
          ],
        },
      ]);
      mockPrisma.historicalPercentage.upsert.mockResolvedValue({});
      mockPrisma.subactivity.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 0 }]);
      mockPrisma.activity.findMany.mockResolvedValue([]);

      await service.execute(2025);

      expect(mockPrisma.historicalPercentage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ percentage: 75 }),
        }),
      );
    });
  });
});
