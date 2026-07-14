import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

const mockPrisma = {
  activity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  subactivity: {
    findUnique: jest.fn(),
  },
  process: {
    findUnique: jest.fn(),
  },
  annualTarget: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  execution: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  // El servicio ejecuta las escrituras compuestas (actividad + su ejecución)
  // dentro de una transacción: el mock la resuelve con el mismo cliente.
  $transaction: jest.fn((cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma)),
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  // ─── upsertTarget ─────────────────────────────────────────────────────────────

  describe('upsertTarget(subactivityId, year, target)', () => {
    it('should create a new target when none exists', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue(null);
      mockPrisma.annualTarget.upsert.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 100,
        isLocked: false,
      });

      const result = await service.upsertTarget('pa-sesiones', 2025, 100);

      expect(mockPrisma.annualTarget.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subactivityId_year: { subactivityId: 'pa-sesiones', year: 2025 } },
          create: expect.objectContaining({ subactivityId: 'pa-sesiones', year: 2025, target: 100, isLocked: false }),
          update: { target: 100 },
        }),
      );
      expect(result.target).toBe(100);
    });

    it('should update an existing target when isLocked is false', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 80,
        isLocked: false,
      });
      mockPrisma.annualTarget.upsert.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 120,
        isLocked: false,
      });

      const result = await service.upsertTarget('pa-sesiones', 2025, 120);

      expect(mockPrisma.annualTarget.upsert).toHaveBeenCalled();
      expect(result.target).toBe(120);
    });

    it('should throw ConflictException (409) when target is locked', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 100,
        isLocked: true,
      });

      await expect(
        service.upsertTarget('pa-sesiones', 2025, 200),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.annualTarget.upsert).not.toHaveBeenCalled();
    });

    it('should NOT throw BadRequestException when target is locked — must be ConflictException', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 100,
        isLocked: true,
      });

      const rejection = service.upsertTarget('pa-sesiones', 2025, 200);

      await expect(rejection).rejects.toBeInstanceOf(ConflictException);
      await expect(rejection).rejects.not.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create(dto)', () => {
    const validDto: CreateActivityDto = {
      processId: 'fechas-especiales',
      subactivityId: 'pa-sesiones',
      title: 'Sesión de pausas',
      description: 'Descripción de la sesión',
      message: 'Mensaje motivacional',
      date: '2025-06-15',
      attendees: 30,
      departments: ['TI', 'RRHH'],
    };

    it('should call prisma.activity.create with correct data', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({ id: 'fechas-especiales' });
      mockPrisma.subactivity.findUnique.mockResolvedValue({
        id: 'pa-sesiones',
        processId: 'fechas-especiales',
      });
      mockPrisma.activity.create.mockResolvedValue({
        id: 'act-uuid',
        ...validDto,
        year: 2025,
        photos: [],
      });

      await service.create(validDto);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            processId: 'fechas-especiales',
            subactivityId: 'pa-sesiones',
            title: 'Sesión de pausas',
            attendees: 30,
            departments: ['TI', 'RRHH'],
          }),
        }),
      );
    });

    it('should throw BadRequestException when process does not exist', async () => {
      mockPrisma.process.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.activity.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when subactivity does not belong to process', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({ id: 'fechas-especiales' });
      mockPrisma.subactivity.findUnique.mockResolvedValue({
        id: 'pa-sesiones',
        processId: 'otro-proceso', // pertenece a otro proceso
      });

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.activity.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when subactivity does not exist', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({ id: 'fechas-especiales' });
      mockPrisma.subactivity.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('should derive year from date field', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({ id: 'fechas-especiales' });
      mockPrisma.subactivity.findUnique.mockResolvedValue({
        id: 'pa-sesiones',
        processId: 'fechas-especiales',
      });
      mockPrisma.activity.create.mockResolvedValue({
        id: 'act-uuid',
        year: 2025,
        photos: [],
      });

      await service.create({ ...validDto, date: '2025-03-10' });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ year: 2025 }),
        }),
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.remove('no-existe')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.activity.delete).not.toHaveBeenCalled();
    });

    it('should call prisma.activity.delete after confirming activity exists', async () => {
      const activity = { id: 'act-1', title: 'Test', photos: [] };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockPrisma.activity.delete.mockResolvedValue(activity);

      await service.remove('act-1');

      expect(mockPrisma.activity.delete).toHaveBeenCalledWith({
        where: { id: 'act-1' },
      });
    });
  });

  // ─── lockTarget ──────────────────────────────────────────────────────────────

  describe('lockTarget(subactivityId, year)', () => {
    it('should throw NotFoundException when target does not exist', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue(null);

      await expect(service.lockTarget('pa-sesiones', 2025)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update isLocked to true when target exists', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 100,
        isLocked: false,
      });
      mockPrisma.annualTarget.update.mockResolvedValue({
        id: 'uuid-1',
        isLocked: true,
      });

      const result = await service.lockTarget('pa-sesiones', 2025);

      expect(mockPrisma.annualTarget.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isLocked: true },
        }),
      );
      expect(result.isLocked).toBe(true);
    });
  });

  // ─── unlockTarget ────────────────────────────────────────────────────────────

  describe('unlockTarget(subactivityId, year)', () => {
    it('should throw NotFoundException when target does not exist', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue(null);

      await expect(service.unlockTarget('pa-sesiones', 2025)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reopen a locked target for editing', async () => {
      mockPrisma.annualTarget.findUnique.mockResolvedValue({
        id: 'uuid-1',
        subactivityId: 'pa-sesiones',
        year: 2025,
        target: 100,
        isLocked: true,
      });
      mockPrisma.annualTarget.update.mockResolvedValue({
        id: 'uuid-1',
        isLocked: false,
      });

      const result = await service.unlockTarget('pa-sesiones', 2025);

      expect(mockPrisma.annualTarget.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isLocked: false },
        }),
      );
      expect(result.isLocked).toBe(false);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update(id, dto)', () => {
    const existing = {
      id: 'act-1',
      processId: 'sst',
      subactivityId: 'sst-cap',
      year: 2025,
      date: new Date('2025-03-10'),
      photos: [],
    };

    it('should sync the linked execution when the date changes', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(existing);
      mockPrisma.activity.update.mockResolvedValue({
        ...existing,
        year: 2026,
        date: new Date('2026-01-15'),
      });

      await service.update('act-1', { date: '2026-01-15' });

      expect(mockPrisma.execution.updateMany).toHaveBeenCalledWith({
        where: { activityId: 'act-1' },
        data: {
          subactivityId: 'sst-cap',
          date: new Date('2026-01-15'),
          year: 2026,
        },
      });
    });

    it('should move the execution when the subactivity changes', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(existing);
      mockPrisma.subactivity.findUnique.mockResolvedValue({
        id: 'sst-insp',
        processId: 'sst',
      });
      mockPrisma.activity.update.mockResolvedValue({
        ...existing,
        subactivityId: 'sst-insp',
      });

      await service.update('act-1', { subactivityId: 'sst-insp' });

      expect(mockPrisma.execution.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subactivityId: 'sst-insp' }),
        }),
      );
    });

    it('should throw BadRequestException when the subactivity belongs to another process', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(existing);
      mockPrisma.subactivity.findUnique.mockResolvedValue({
        id: 'pa-sesiones',
        processId: 'pausas-activas',
      });

      await expect(
        service.update('act-1', { subactivityId: 'pa-sesiones' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.activity.update).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne(id)', () => {
    it('should return activity with photos when it exists', async () => {
      const activity = {
        id: 'act-1',
        title: 'Actividad',
        photos: [{ id: 'photo-1', url: 'https://example.com/img.jpg' }],
      };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);

      const result = await service.findOne('act-1');

      expect(result).toEqual(activity);
      expect(mockPrisma.activity.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'act-1' }, include: { photos: true } }),
      );
    });

    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
