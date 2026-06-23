import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProcessesModule } from './processes/processes.module.js';
import { ActivitiesModule } from './activities/activities.module.js';
import { UploadModule } from './upload/upload.module.js';
import { AnnualResetModule } from './annual-reset/annual-reset.module.js';
import { AbsenceModule } from './absence/absence.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProcessesModule,
    ActivitiesModule,
    UploadModule,
    AnnualResetModule,
    AbsenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
