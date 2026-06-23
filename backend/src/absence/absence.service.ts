import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';

interface CachedToken {
  value: string;
  expiresAt: number; // timestamp en ms
}

export interface Cie10Result {
  code: string;
  title: string;
}

@Injectable()
export class AbsenceService {
  private cachedToken: CachedToken | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateAbsenceDto) {
    // Validar que el proceso existe y es de tipo AUSENTISMO
    const process = await this.prisma.process.findUnique({
      where: { id: dto.processId },
    });

    if (!process) {
      throw new BadRequestException(`Proceso '${dto.processId}' no existe`);
    }

    if (process.type !== 'AUSENTISMO') {
      throw new BadRequestException(
        `El proceso '${dto.processId}' no es de tipo AUSENTISMO`,
      );
    }

    // Calcular días (ambos inclusive)
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    if (days < 1) {
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
    }

    // Año derivado de startDate
    const year = start.getFullYear();

    return this.prisma.absenceRecord.create({
      data: {
        processId: dto.processId,
        identification: dto.identification,
        employeeName: dto.employeeName,
        requestDate: new Date(dto.requestDate),
        startDate: start,
        endDate: end,
        days,
        leaveReason: dto.leaveReason,
        incapacityType: dto.incapacityType,
        department: dto.department,
        diagnosticCode: dto.diagnosticCode ?? null,
        diagnosticConcept: dto.diagnosticConcept ?? null,
        year,
      },
    });
  }

  // ─── Find by process ─────────────────────────────────────────────────────────

  async findByProcess(processId: string, year: number) {
    return this.prisma.absenceRecord.findMany({
      where: { processId, year },
      orderBy: { startDate: 'desc' },
    });
  }

  // ─── CIE-10 search ──────────────────────────────────────────────────────────

  async searchCie10(q: string): Promise<Cie10Result[]> {
    const clientId = this.configService.get<string>('WHO_ICD_CLIENT_ID');
    const clientSecret = this.configService.get<string>('WHO_ICD_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return [];
    }

    try {
      const token = await this.getWhoToken(clientId, clientSecret);

      const response = await axios.get(
        `https://id.who.int/icd/release/11/2024-01/mms/search`,
        {
          params: {
            q,
            useFlexisearch: false,
            flatResults: false,
            highlightingEnabled: false,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Accept-Language': 'es',
            'API-Version': 'v2',
          },
        },
      );

      const entities: Array<{ theCode: string; title: string }> =
        (response.data?.destinationEntities ?? []).filter(
          (e: { theCode: string }) => e.theCode,
        );

      return entities.slice(0, 10).map((item) => ({
        code: item.theCode,
        title: item.title.replace(/<[^>]+>/g, ''),
      }));
    } catch {
      return [];
    }
  }

  // ─── Token OAuth 2.0 (caché en memoria) ─────────────────────────────────────

  private async getWhoToken(
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const now = Date.now();

    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      return this.cachedToken.value;
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'icdapi_access');
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(
      'https://icdaccessmanagement.who.int/connect/token',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const accessToken: string = response.data.access_token;
    const expiresIn: number = response.data.expires_in;

    // Guardar con 60 segundos de margen
    this.cachedToken = {
      value: accessToken,
      expiresAt: now + (expiresIn - 60) * 1000,
    };

    return accessToken;
  }
}
