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
import { CreateSubactivityDto, CreateGlobalSubactivityDto } from './dto/create-subactivity.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ProcessScopeGuard } from '../auth/guards/process-scope.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ProcessScope } from '../auth/decorators/process-scope.decorator.js';

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
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('body:processId')
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('activity:id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('activity:id')
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
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('subactivity:subactivityId')
  createExecution(
    @Param('subactivityId') subactivityId: string,
    @Body() dto: CreateExecutionDto,
  ) {
    return this.activitiesService.createExecution(subactivityId, dto);
  }

  @Delete('executions/:executionId')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('execution:executionId')
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
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('subactivity:subactivityId')
  upsertTarget(
    @Param('subactivityId') subactivityId: string,
    @Param('year', ParseIntPipe) year: number,
    @Body('target', ParseIntPipe) target: number,
  ) {
    return this.activitiesService.upsertTarget(subactivityId, year, target);
  }

  @Patch('subactivity/:subactivityId/targets/:year/lock')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('subactivity:subactivityId')
  lockTarget(
    @Param('subactivityId') subactivityId: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.activitiesService.lockTarget(subactivityId, year);
  }

  @Patch('subactivity/:subactivityId/targets/:year/unlock')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('subactivity:subactivityId')
  unlockTarget(
    @Param('subactivityId') subactivityId: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.activitiesService.unlockTarget(subactivityId, year);
  }

  // ─── Admin: crear subactividades dinámicamente ───────────────────────────────

  @Post('subactivities')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('body:processId')
  createSubactivity(@Body() dto: CreateSubactivityDto) {
    return this.activitiesService.createSubactivityWithTarget(dto.processId, dto.name, dto.year, dto.target);
  }

  // Crea la subactividad en TODOS los procesos: solo el superadmin, porque
  // alcanza provincias fuera del ámbito de cualquier operador.
  @Post('subactivities/global')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createGlobalSubactivity(@Body() dto: CreateGlobalSubactivityDto) {
    return this.activitiesService.createGlobalSubactivityWithTarget(dto.name, dto.year, dto.target);
  }

  @Delete('subactivities/:id')
  @UseGuards(JwtAuthGuard, ProcessScopeGuard)
  @ProcessScope('subactivity:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubactivity(@Param('id') id: string): Promise<void> {
    return this.activitiesService.deleteSubactivity(id);
  }
}
