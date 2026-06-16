import { Controller, Post, Get, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { AnnualResetService } from './annual-reset.service.js';
import { AnnualResetDto } from './dto/annual-reset.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('annual-reset')
@UseGuards(JwtAuthGuard)
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
