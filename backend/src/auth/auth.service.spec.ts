import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt para no ejecutar hashing real en tests
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockJwtService = {
  sign: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Todos los usuarios de users.config.ts tienen su hash configurado
    mockConfigService.get.mockImplementation((key: string) => {
      if (key.endsWith('_PASSWORD_HASH')) return '$2b$10$hashedpassword';
      return undefined;
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login(dto)', () => {
    const validCredentials = { username: 'iccu', password: 'secreto123' };

    it('should return accessToken when credentials are correct', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      const result = await service.login(validCredentials);

      expect(result).toEqual({ accessToken: 'jwt.token.aqui' });
    });

    it('should sign the admin payload with role admin', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      await service.login(validCredentials);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'iccu',
        username: 'iccu',
        role: 'admin',
      });
    });

    it('should sign the operador payload with role operador', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      await service.login({ username: 'sst', password: 'secreto123' });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'sst',
        username: 'sst',
        role: 'operador',
      });
    });

    it('should NOT put the process scope in the token', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      await service.login({ username: 'bienestar', password: 'secreto123' });

      const payload = mockJwtService.sign.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('processes');
    });

    it('should accept the username regardless of case', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      await service.login({ username: 'ICCU', password: 'secreto123' });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'iccu' }),
      );
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      await expect(
        service.login({ username: 'hacker', password: 'secreto123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should not call bcrypt.compare when the user does not exist', async () => {
      await expect(
        service.login({ username: 'otro', password: 'secreto123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the password is wrong', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the password hash is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile(username)', () => {
    it('should return processes = null for the superadmin', () => {
      expect(service.getProfile('iccu')).toEqual({
        username: 'iccu',
        role: 'admin',
        processes: null,
      });
    });

    it('should return only the assigned processes for an operador', () => {
      const profile = service.getProfile('sst');

      expect(profile.role).toBe('operador');
      expect(profile.processes).toContain('dia-salud-sst');
      // Ausentismo es exclusivo del superadmin
      expect(profile.processes).not.toContain('medicina-preventiva');
    });

    it('should share salud-mental and capacitaciones between both operadores', () => {
      const sst = service.getProfile('sst').processes!;
      const bienestar = service.getProfile('bienestar').processes!;

      for (const shared of ['salud-mental', 'capacitaciones']) {
        expect(sst).toContain(shared);
        expect(bienestar).toContain(shared);
      }
    });

    it('should throw UnauthorizedException for an unknown user', () => {
      expect(() => service.getProfile('fantasma')).toThrow(UnauthorizedException);
    });
  });
});
