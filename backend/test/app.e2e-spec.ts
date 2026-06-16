// Definir variables de entorno requeridas ANTES de importar cualquier módulo.
// Esto evita que JwtModule y JwtStrategy fallen por JWT_SECRET no definido.
// ADMIN_PASSWORD_HASH es el hash bcrypt de 'admin123' generado con saltRounds=10.
process.env.JWT_SECRET = 'test-secret-e2e-123';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2b$10$w69BUmJJci3npPtdIQ8IbOKgs28gph9rcRAHu2UPpulbzoAD9L3My';
process.env.DATABASE_URL = 'postgresql://mock/mock'; // no se usa en e2e, Prisma está mockeado

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UploadService } from '../src/upload/upload.service';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

// ─── Mocks de infraestructura ─────────────────────────────────────────────────

const mockPrisma = {
  process: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  subactivity: {
    findUnique: jest.fn(),
  },
  annualTarget: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  execution: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  activityPhoto: {
    count: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  historicalPercentage: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  historicalPercentageSubactivity: {
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockUploadService = {
  uploadPhoto: jest.fn(),
  removePhoto: jest.fn(),
  removePhotosByActivity: jest.fn(),
};

describe('ICCU Backend (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(UploadService)
      .useValue(mockUploadService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Replicar la misma configuración de main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Auth (e2e) ─────────────────────────────────────────────────────────────

  describe('Auth (e2e)', () => {
    it('POST /api/auth/login — credenciales válidas → 200 + access_token', async () => {
      // ADMIN_PASSWORD_HASH en process.env está configurado como el hash de 'admin123'
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('POST /api/auth/login — credenciales inválidas → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'hacker', password: 'claveWrong123' });

      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login — body vacío → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /api/auth/login — password muy corta → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ─── Processes (e2e) ────────────────────────────────────────────────────────

  describe('Processes (e2e)', () => {
    it('GET /api/processes → 200 + array de procesos', async () => {
      mockPrisma.process.findMany.mockResolvedValue([
        {
          id: 'pausas-activas',
          name: 'Pausas Activas',
          description: 'Sesiones de pausas activas',
          provinceId: 'bogota',
          subactivities: [
            {
              id: 'pa-sesiones',
              name: 'Sesiones',
              targets: [{ target: 100 }],
              executions: [{ count: 50 }],
            },
          ],
          historicalPercentages: [{ year: 2024, percentage: 80 }],
        },
      ]);

      const res = await request(app.getHttpServer()).get('/api/processes');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('id', 'pausas-activas');
      expect(res.body.data[0]).toHaveProperty('progress');
    });

    it('GET /api/processes/:id → 200 + proceso con métricas', async () => {
      mockPrisma.process.findUnique.mockResolvedValue({
        id: 'pausas-activas',
        name: 'Pausas Activas',
        description: 'Desc',
        provinceId: 'bogota',
        subactivities: [
          {
            id: 'pa-sesiones',
            name: 'Sesiones',
            targets: [{ target: 156 }],
            executions: [{ count: 39 }],
          },
        ],
        historicalPercentages: [],
      });

      const res = await request(app.getHttpServer()).get(
        '/api/processes/pausas-activas',
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'pausas-activas');
      expect(res.body.data).toHaveProperty('progress', 25);
      expect(res.body.data).toHaveProperty('subactivities');
      expect(Array.isArray(res.body.data.subactivities)).toBe(true);
    });

    it('GET /api/processes/proceso-inexistente → 404', async () => {
      mockPrisma.process.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/api/processes/proceso-inexistente',
      );

      expect(res.status).toBe(404);
    });

    it('GET /api/processes → respuesta envuelta con ResponseInterceptor', async () => {
      mockPrisma.process.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/api/processes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('message', 'OK');
      expect(res.body).toHaveProperty('error', null);
    });
  });

  // ─── Activities admin — rutas protegidas (e2e) ───────────────────────────────

  describe('Activities admin (e2e)', () => {
    it('POST /api/activities sin JWT → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/activities')
        .send({
          processId: 'pausas-activas',
          subactivityId: 'pa-sesiones',
          title: 'Sesión',
          description: 'Descripción',
          message: 'Mensaje',
          date: '2025-06-15',
          attendees: 10,
          departments: ['TI'],
        });

      expect(res.status).toBe(401);
    });

    it('PATCH /api/activities/subactivity/:id/targets/:year sin JWT → 401', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/activities/subactivity/pa-sesiones/targets/2025')
        .send({ target: 100 });

      expect(res.status).toBe(401);
    });

    it('DELETE /api/activities/:id sin JWT → 401', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/api/activities/some-uuid',
      );

      expect(res.status).toBe(401);
    });

    it('PATCH /api/activities/:id sin JWT → 401', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/activities/some-uuid')
        .send({ title: 'Nuevo título' });

      expect(res.status).toBe(401);
    });
  });

  // ─── Annual reset — rutas protegidas (e2e) ───────────────────────────────────

  describe('Annual reset (e2e)', () => {
    it('POST /api/annual-reset sin JWT → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/annual-reset')
        .send({ yearToClose: 2025 });

      expect(res.status).toBe(401);
    });

    it('GET /api/annual-reset/preview sin JWT → 401', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/annual-reset/preview?year=2025',
      );

      expect(res.status).toBe(401);
    });
  });
});
