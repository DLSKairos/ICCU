import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service.js';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private readonly logger = new Logger('UploadService');

  constructor(private readonly prisma: PrismaService) {}

  async uploadPhoto(
    activityId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; cloudinaryId: string }> {
    // Verificar que la actividad existe
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { _count: { select: { photos: true } } },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad '${activityId}' no encontrada`);
    }

    if (activity._count.photos >= 10) {
      throw new BadRequestException('Una actividad puede tener máximo 10 fotos');
    }

    const uploadResult = await this.uploadToCloudinary(file, activityId);

    const photo = await this.prisma.activityPhoto.create({
      data: {
        activityId,
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
      },
    });

    return { url: photo.url, cloudinaryId: photo.cloudinaryId };
  }

  async removePhoto(photoId: string): Promise<void> {
    const photo = await this.prisma.activityPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Foto '${photoId}' no encontrada`);
    }

    // Borrar en Cloudinary primero
    await cloudinary.uploader.destroy(photo.cloudinaryId);

    // Luego borrar en BD
    await this.prisma.activityPhoto.delete({ where: { id: photoId } });
  }

  async removePhotosByActivity(activityId: string): Promise<void> {
    const photos = await this.prisma.activityPhoto.findMany({
      where: { activityId },
      select: { cloudinaryId: true },
    });

    // Borrar en Cloudinary
    await Promise.allSettled(
      photos.map((p: { cloudinaryId: string }) =>
        cloudinary.uploader.destroy(p.cloudinaryId),
      ),
    );

    // BD: el cascade de ActivityPhoto maneja esto cuando se borra la Activity,
    // pero si se llama directamente, borramos explícitamente.
    await this.prisma.activityPhoto.deleteMany({ where: { activityId } });
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    // Falla temprano y claro si el servidor no tiene credenciales de Cloudinary,
    // en vez de dejar que el SDK lance un error críptico.
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    if (!cloud_name || !api_key || !api_secret) {
      throw new InternalServerErrorException(
        'Cloudinary no está configurado en el servidor: faltan las credenciales ' +
          '(CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `iccu/activities/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            const detail = error?.message ?? 'respuesta vacía de Cloudinary';
            this.logger.error(`Error al subir imagen a Cloudinary: ${detail}`);
            reject(
              new InternalServerErrorException(
                `Error al subir imagen a Cloudinary: ${detail}`,
              ),
            );
          } else {
            resolve(result);
          }
        },
      );

      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);
    });
  }
}
