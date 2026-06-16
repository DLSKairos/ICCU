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
import { ActivitiesService } from './activities.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { CreateExecutionDto } from './dto/create-execution.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // ─── Public: leer actividades ────────────────────────────────────────────────

  @Get('process/:processId')
  findAllByProcess(
    @Param('processId') processId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.activitiesService.findAllByProcess(processId, year, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  // ─── Admin: crear / editar / borrar actividades ──────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.activitiesService.remove(id);
  }

  // ─── Admin: executions ────────────────────────────────────────────────────────

  @Get('subactivity/:subactivityId/executions')
  findExecutions(
    @Param('subactivityId') subactivityId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.activitiesService.findExecutionsBySubactivity(subactivityId, year);
  }

  @Post('subactivity/:subactivityId/executions')
  @UseGuards(JwtAuthGuard)
  createExecution(
    @Param('subactivityId') subactivityId: string,
    @Body() dto: CreateExecutionDto,
  ) {
    return this.activitiesService.createExecution(subactivityId, dto);
  }

  @Delete('executions/:executionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeExecution(@Param('executionId') executionId: string): Promise<void> {
    return this.activitiesService.removeExecution(executionId);
  }

  // ─── Admin: annual targets ────────────────────────────────────────────────────

  @Get('process/:processId/targets')
  findTargets(
    @Param('processId') processId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.activitiesService.findTargetsByProcess(processId, year);
  }

  @Patch('subactivity/:subactivityId/targets/:year')
  @UseGuards(JwtAuthGuard)
  upsertTarget(
    @Param('subactivityId') subactivityId: string,
    @Param('year', ParseIntPipe) year: number,
    @Body('target', ParseIntPipe) target: number,
  ) {
    return this.activitiesService.upsertTarget(subactivityId, year, target);
  }

  @Patch('subactivity/:subactivityId/targets/:year/lock')
  @UseGuards(JwtAuthGuard)
  lockTarget(
    @Param('subactivityId') subactivityId: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.activitiesService.lockTarget(subactivityId, year);
  }
}
