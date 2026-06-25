import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const users = [
      {
        username: this.configService.get<string>('ADMIN_USERNAME'),
        hash: this.configService.get<string>('ADMIN_PASSWORD_HASH'),
        role: 'admin',
      },
      {
        username: this.configService.get<string>('OPERATOR_USERNAME'),
        hash: this.configService.get<string>('OPERATOR_PASSWORD_HASH'),
        role: 'operador',
      },
    ].filter(u => u.username && u.hash);

    if (users.length === 0) {
      throw new UnauthorizedException('Credenciales no configuradas');
    }

    const matched = users.find(u => u.username === dto.username);
    if (!matched) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, matched.hash!);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: matched.role === 'admin' ? 'admin' : 'operador',
      username: dto.username,
      role: matched.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
