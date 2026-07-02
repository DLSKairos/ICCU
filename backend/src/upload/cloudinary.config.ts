import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const cloud_name = configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = configService.get<string>('CLOUDINARY_API_KEY');
    const api_secret = configService.get<string>('CLOUDINARY_API_SECRET');

    const missing = [
      !cloud_name && 'CLOUDINARY_CLOUD_NAME',
      !api_key && 'CLOUDINARY_API_KEY',
      !api_secret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean);

    const logger = new Logger('CloudinaryConfig');
    if (missing.length > 0) {
      logger.error(
        `Faltan variables de entorno de Cloudinary: ${missing.join(', ')}. ` +
          'La subida de imágenes fallará hasta que se configuren en el servidor.',
      );
    } else {
      logger.log(`Cloudinary configurado (cloud_name: ${cloud_name}).`);
    }

    return cloudinary.config({ cloud_name, api_key, api_secret });
  },
};
