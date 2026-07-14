import { Controller, Post, Get, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { AnnualResetService } from './annual-reset.service.js';
import { AnnualResetDto } from './dto/annual-reset.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

// El reinicio anual borra los datos operativos de TODOS los procesos: es
// exclusivo del superadmin, no de los operadores.
@Controller('annual-reset')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnnualResetController {
  constructor(private readonly annualResetService: AnnualResetService) {}

  @Get('preview')
  preview(
    @Query('year', new DefaultValuePipe(new Date().getFullYear() - 1), ParseIntPipe) year: number,
  ) {
    return this.annualResetService.preview(year);
  }

  @Post()
  execute(@Body() dto: AnnualResetDto) {
    return this.annualResetService.execute(dto.yearToClose);
  }
}
