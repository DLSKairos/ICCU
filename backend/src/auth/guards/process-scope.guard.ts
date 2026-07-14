import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PROCESS_SCOPE_KEY } from '../decorators/process-scope.decorator.js';
import { canAccessProcess } from '../users.config.js';

interface ScopedRequest {
  user?: { username?: string; role?: string };
  params: Record<string, string>;
  body: Record<string, unknown>;
}

/**
 * Restringe las escrituras al alcance de procesos del usuario.
 *
 * El admin (superadmin) pasa siempre. Un operador solo puede modificar recursos
 * que pertenezcan a los procesos que tiene asignados en users.config.ts. El
 * alcance se relee de la configuración en cada request, nunca del token.
 *
 * Debe ir SIEMPRE después de JwtAuthGuard: depende de `request.user`.
 */
@Injectable()
export class ProcessScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const source = this.reflector.getAllAndOverride<string | undefined>(
      PROCESS_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!source) return true;

    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;

    if (!user?.username || !user.role) {
      throw new ForbiddenException('No autenticado');
    }

    // El superadmin no tiene restricción de provincias.
    if (user.role === 'admin') return true;

    const processId = await this.resolveProcessId(source, request);

    if (!canAccessProcess(user.username, processId)) {
      throw new ForbiddenException(
        'No tienes acceso a esta provincia. Solo puedes gestionar los procesos que tienes asignados.',
      );
    }

    return true;
  }

  private async resolveProcessId(
    source: string,
    request: ScopedRequest,
  ): Promise<string> {
    const [origin, key] = source.split(':');

    switch (origin) {
      case 'body': {
        const value = request.body?.[key];
        if (typeof value !== 'string' || !value) {
          throw new BadRequestException(`Falta '${key}' en la petición`);
        }
        return value;
      }

      case 'param':
        return this.requireParam(request, key);

      case 'activity': {
        const activityId = this.requireParam(request, key);
        const activity = await this.prisma.activity.findUnique({
          where: { id: activityId },
          select: { processId: true },
        });
        if (!activity) {
          throw new NotFoundException(`Actividad '${activityId}' no encontrada`);
        }
        return activity.processId;
      }

      case 'subactivity': {
        const subactivityId = this.requireParam(request, key);
        const subactivity = await this.prisma.subactivity.findUnique({
          where: { id: subactivityId },
          select: { processId: true },
        });
        if (!subactivity) {
          throw new NotFoundException(
            `Subactividad '${subactivityId}' no encontrada`,
          );
        }
        return subactivity.processId;
      }

      case 'execution': {
        const executionId = this.requireParam(request, key);
        const execution = await this.prisma.execution.findUnique({
          where: { id: executionId },
          select: { subactivity: { select: { processId: true } } },
        });
        if (!execution) {
          throw new NotFoundException(`Ejecución '${executionId}' no encontrada`);
        }
        return execution.subactivity.processId;
      }

      case 'photo': {
        const photoId = this.requireParam(request, key);
        const photo = await this.prisma.activityPhoto.findUnique({
          where: { id: photoId },
          select: { activity: { select: { processId: true } } },
        });
        if (!photo) {
          throw new NotFoundException(`Foto '${photoId}' no encontrada`);
        }
        return photo.activity.processId;
      }

      default:
        // Un @ProcessScope mal escrito no debe degradar a "permitir".
        throw new ForbiddenException('Alcance de proceso mal configurado');
    }
  }

  private requireParam(request: ScopedRequest, key: string): string {
    const value = request.params?.[key];
    if (!value) {
      throw new BadRequestException(`Falta el parámetro '${key}'`);
    }
    return value;
  }
}
