import { Module } from '@nestjs/common';
import { AbsenceService } from './absence.service.js';
import { AbsenceController } from './absence.controller.js';

@Module({
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService],
})
export class AbsenceModule {}
