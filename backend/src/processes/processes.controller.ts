import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ProcessesService } from './processes.service.js';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  @Get()
  findAll(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.processesService.findAll(year);
  }

  @Get('by-province/:provinceId')
  findByProvince(
    @Param('provinceId') provinceId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.processesService.findByProvinceId(provinceId, year);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.processesService.findOne(id, year);
  }
}
