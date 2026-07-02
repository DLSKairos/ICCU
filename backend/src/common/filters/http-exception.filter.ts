import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as Record<string, unknown>;
        if (typeof body['message'] === 'string') {
          message = body['message'];
        } else if (Array.isArray(body['message'])) {
          message = (body['message'] as string[]).join(', ');
        }
        if (typeof body['error'] === 'string') {
          error = body['error'];
        }
      }
    } else {
      // Excepción no controlada (ej. error de Cloudinary/Prisma): loguear el stack
      // completo para que aparezca en los logs del servidor (Render) y no se pierda.
      this.logger.error(
        `Excepción no controlada en ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      data: null,
      message,
      error: error ?? (status >= 500 ? 'Internal Server Error' : undefined),
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
