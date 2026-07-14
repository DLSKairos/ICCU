import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { findUserConfig, getUserProcesses, UserRole } from './users.config.js';

export interface UserProfile {
  username: string;
  role: UserRole;
  /** `null` = todos los procesos (admin). */
  processes: string[] | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = findUserConfig(dto.username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const hash = this.configService.get<string>(user.hashEnv);
    if (!hash) {
      throw new UnauthorizedException('Credenciales no configuradas');
    }

    const passwordValid = await bcrypt.compare(dto.password, hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // El token NO lleva el alcance de procesos: se relee de la configuración en
    // cada request (ver ProcessScopeGuard). Así un token viejo no conserva
    // accesos que ya fueron revocados.
    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
      role: user.role,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  /** Perfil vigente del usuario del token — lo consume el frontend en /auth/me. */
  getProfile(username: string): UserProfile {
    const user = findUserConfig(username);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return {
      username: user.username,
      role: user.role,
      processes: getUserProcesses(user.username),
    };
  }
}
