import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { AbsenceService } from './absence.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('absence')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  // Rutas estáticas ANTES que las dinámicas
  @Get('cie10/search')
  searchCie10(@Query('q') q: string) {
    return this.absenceService.searchCie10(q ?? '');
  }

  @Get('employees/search')
  searchEmployees(@Query('q') q: string) {
    return this.absenceService.searchEmployees(q ?? '');
  }

  @Get('process/:processId')
  findByProcess(
    @Param('processId') processId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.absenceService.findByProcess(processId, year);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateAbsenceDto) {
    return this.absenceService.create(dto);
  }
}
