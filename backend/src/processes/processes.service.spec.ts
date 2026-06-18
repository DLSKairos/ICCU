import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  process: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('ProcessesService', () => {
  let service: ProcessesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProcessesService>(ProcessesService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll(year)', () => {
    it('should return processes mapped to ProcessSummary array', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'pausas-activas',
          name: 'Pausas Activas',
          description: 'Desc',
          provinceId: 'bogota',
          subactivities: [],
          historicalPercentages: [],
        },
      ]);

      const result = await service.findAll(2025);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe('pausas-activas');
    });

    it('should calculate progress as 25% when target=156 and executed=39', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Proceso 1',
          description: 'Desc',
          provinceId: 'prov1',
          subactivities: [
            {
              id: 'sub1',
              name: 'Subactividad 1',
              targets: [{ target: 156 }],
              executions: [{ count: 39 }],
            },
          ],
          historicalPercentages: [],
        },
      ]);

      const result = await service.findAll(2025);

      expect(result[0].progress).toBe(25);
      expect(result[0].targetTotal).toBe(156);
      expect(result[0].executedTotal).toBe(39);
    });

    it('should return progress=0 when target=0 (no division by zero)', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Proceso 1',
          description: 'Desc',
          provinceId: 'prov1',
          subactivities: [
            {
              id: 'sub1',
              name: 'Subactividad 1',
              targets: [],
              executions: [{ count: 10 }],
            },
          ],
          historicalPercentages: [],
        },
      ]);

      const result = await service.findAll(2025);

      expect(result[0].progress).toBe(0);
      expect(result[0].targetTotal).toBe(0);
    });

    it('should return progress > 100 when executed exceeds target', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Proceso 1',
          description: 'Desc',
          provinceId: 'prov1',
          subactivities: [
            {
              id: 'sub1',
              name: 'Subactividad 1',
              targets: [{ target: 50 }],
              executions: [{ count: 75 }],
            },
          ],
          historicalPercentages: [],
        },
      ]);

      const result = await service.findAll(2025);

      expect(result[0].progress).toBe(150);
    });

    it('should sum executions from multiple execution records for a subactivity', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Proceso 1',
          description: 'Desc',
          provinceId: 'prov1',
          subactivities: [
            {
              id: 'sub1',
              name: 'Sub 1',
              targets: [{ target: 100 }],
              executions: [{ count: 30 }, { count: 20 }],
            },
          ],
          historicalPercentages: [],
        },
      ]);

      const result = await service.findAll(2025);

      expect(result[0].executedTotal).toBe(50);
      expect(result[0].progress).toBe(50);
    });

    it('should include historicalPercentages ordered as returned by prisma', async () => {
      const historical = [
        { year: 2023, percentage: 80 },
        { year: 2024, percentage: 90 },
      ];
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Proceso 1',
          description: 'Desc',
          provinceId: 'prov1',
          subactivities: [],
          historicalPercentages: historical,
        },
      ]);

      const result = await service.findAll(2025);

      expect(result[0].historicalPercentages).toEqual(historical);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne(id, year)', () => {
    it('should return a ProcessDetail with subactivities and historicalPercentages', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'pausas-activas',
        name: 'Pausas Activas',
        description: 'Desc pausas',
        provinceId: 'bogota',
        subactivities: [
          {
            id: 'pa-sesiones',
            name: 'Sesiones',
            targets: [{ target: 100, isLocked: false }],
            executions: [{ date: new Date('2025-06-01'), count: 60 }],
          },
        ],
        activities: [],
        historicalPercentages: [{ year: 2023, percentage: 75 }],
      });

      const result = await service.findOne('pausas-activas', 2025);

      expect(result.id).toBe('pausas-activas');
      expect(result.subactivities).toHaveLength(1);
      expect(result.subactivities[0].annualTarget).toBe(100);
      expect(result.subactivities[0].executions).toHaveLength(1);
      expect(result.subactivities[0].executions[0].count).toBe(60);
      expect(result.historicalPercentages).toEqual([{ year: 2023, percentage: 75 }]);
    });

    it('should throw NotFoundException when process does not exist', async () => {
      mockPrisma.process.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe', 2025)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call prisma with the correct id', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'bienestar',
        name: 'Bienestar',
        description: 'Desc',
        provinceId: 'prov-x',
        subactivities: [],
        activities: [],
        historicalPercentages: [],
      });

      await service.findOne('bienestar', 2025);

      expect(mockPrisma.process.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'bienestar' } }),
      );
    });
  });

  // ─── mapProcessDetail (indirectamente) ───────────────────────────────────────

  describe('ProcessDetail mapping edge cases', () => {
    it('should map annualTarget from targets[0].target and preserve execution dates', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'P1',
        description: 'Desc',
        provinceId: 'prov1',
        subactivities: [
          {
            id: 'sub1',
            name: 'Sub 1',
            targets: [{ target: 200, isLocked: false }],
            executions: [
              { date: new Date('2025-03-15'), count: 50 },
            ],
          },
          {
            id: 'sub2',
            name: 'Sub 2',
            targets: [{ target: 100, isLocked: false }],
            executions: [],
          },
        ],
        activities: [],
        historicalPercentages: [],
      });

      const result = await service.findOne('p1', 2025);

      const sub1 = result.subactivities.find((s) => s.id === 'sub1')!;
      const sub2 = result.subactivities.find((s) => s.id === 'sub2')!;

      expect(sub1.annualTarget).toBe(200);
      expect(sub1.executions[0].date).toBe('2025-03-15');
      expect(sub1.executions[0].count).toBe(50);
      expect(sub2.annualTarget).toBe(100);
      expect(sub2.executions).toHaveLength(0);
    });

    it('should default annualTarget to 0 when subactivity has no targets', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'P1',
        description: 'Desc',
        provinceId: 'prov1',
        subactivities: [
          {
            id: 'sub1',
            name: 'Sub 1',
            targets: [],
            executions: [],
          },
        ],
        activities: [],
        historicalPercentages: [],
      });

      const result = await service.findOne('p1', 2025);

      expect(result.subactivities[0].annualTarget).toBe(0);
    });

    it('should map activities with attendees and photos as URL strings', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'P1',
        description: 'Desc',
        provinceId: 'prov1',
        subactivities: [],
        activities: [
          {
            id: 'act1',
            subactivityId: 'sub1',
            title: 'Taller',
            description: 'Desc taller',
            message: 'Msg',
            date: new Date('2025-05-20'),
            attendees: 42,
            departments: ['RRHH', 'TI'],
            photos: [{ url: 'https://cdn.example.com/foto1.jpg' }],
          },
        ],
        historicalPercentages: [],
      });

      const result = await service.findOne('p1', 2025);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].attendees).toBe(42);
      expect(result.activities[0].date).toBe('2025-05-20');
      expect(result.activities[0].photos).toEqual(['https://cdn.example.com/foto1.jpg']);
    });
  });
});
