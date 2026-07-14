import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProcessScopeGuard } from '../auth/guards/process-scope.guard.js';
import { ProcessScope } from '../auth/decorators/process-scope.decorator.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('upload')
@UseGuards(JwtAuthGuard, ProcessScopeGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('activities/:activityId/photos')
  @ProcessScope('activity:activityId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  uploadPhoto(
    @Param('activityId') activityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadPhoto(activityId, file);
  }

  @Delete('photos/:photoId')
  @ProcessScope('photo:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePhoto(@Param('photoId') photoId: string): Promise<void> {
    return this.uploadService.removePhoto(photoId);
  }
}
