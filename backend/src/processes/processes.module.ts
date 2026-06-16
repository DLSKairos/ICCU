import { Module } from '@nestjs/common';
import { ProcessesService } from './processes.service.js';
import { ProcessesController } from './processes.controller.js';

@Module({
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}
