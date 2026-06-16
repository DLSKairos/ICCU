import { Module } from '@nestjs/common';
import { AnnualResetService } from './annual-reset.service.js';
import { AnnualResetController } from './annual-reset.controller.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [UploadModule],
  controllers: [AnnualResetController],
  providers: [AnnualResetService],
})
export class AnnualResetModule {}
