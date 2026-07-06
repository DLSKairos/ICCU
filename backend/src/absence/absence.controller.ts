import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AbsenceService } from './absence.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { UpdateAbsenceDto } from './dto/update-absence.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

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

  @Get('stats')
  getStats(
    @Query('processId') processId: string,
    @Query('period') period: string,
  ) {
    return this.absenceService.getStats(processId, period);
  }

  @Get('registered')
  getRegisteredEmployees(
    @Query('processId') processId: string,
    @Query('period') period: string,
  ) {
    return this.absenceService.getRegisteredEmployees(processId, period);
  }

  @Get('person/:identification')
  getPersonStats(
    @Param('identification') identification: string,
    @Query('processId') processId: string,
  ) {
    return this.absenceService.getPersonStats(identification, processId);
  }

  @Get('process/:processId')
  findByProcess(
    @Param('processId') processId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.absenceService.findByProcess(processId, year);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateAbsenceDto) {
    return this.absenceService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateAbsenceDto) {
    return this.absenceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.absenceService.remove(id);
  }
}
