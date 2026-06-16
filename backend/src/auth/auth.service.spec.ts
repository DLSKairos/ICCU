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
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login(dto)', () => {
    const validCredentials = {
      username: 'admin',
      password: 'secreto123',
    };

    beforeEach(() => {
      // Configuración base: credenciales válidas
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_USERNAME') return 'admin';
        if (key === 'ADMIN_PASSWORD_HASH') return '$2b$10$hashedpassword';
        return undefined;
      });
    });

    it('should return accessToken when credentials are correct', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      const result = await service.login(validCredentials);

      expect(result).toEqual({ accessToken: 'jwt.token.aqui' });
    });

    it('should call jwtService.sign with correct payload', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.aqui');

      await service.login(validCredentials);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'admin',
        username: 'admin',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException when username does not match ADMIN_USERNAME', async () => {
      await expect(
        service.login({ username: 'hacker', password: 'secreto123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password hash does not match', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when ADMIN_USERNAME is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when ADMIN_PASSWORD_HASH is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_USERNAME') return 'admin';
        if (key === 'ADMIN_PASSWORD_HASH') return undefined;
        return undefined;
      });

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not call bcrypt.compare when username is wrong', async () => {
      await expect(
        service.login({ username: 'otro', password: 'secreto123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return accessToken as string', async () => {
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('signed.token');

      const result = await service.login(validCredentials);

      expect(typeof result.accessToken).toBe('string');
    });
  });
});
