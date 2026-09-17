import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

import { MulterFile } from '../common/interfaces';

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 2400;
const WEBP_QUALITY = 82;

export interface OptimizedWebpImage {
  buffer: Buffer;
  extension: '.webp';
  height: number;
  mimetype: 'image/webp';
  size: number;
  width: number;
}

@Injectable()
export class ImageOptimizationService {
  async convertToWebp(file: MulterFile): Promise<OptimizedWebpImage> {
    try {
      const { data, info } = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: MAX_INPUT_PIXELS,
        sequentialRead: true,
      })
        .rotate()
        .resize({
          width: MAX_OUTPUT_DIMENSION,
          height: MAX_OUTPUT_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: WEBP_QUALITY,
          effort: 5,
          smartSubsample: true,
        })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: data,
        extension: '.webp',
        height: info.height,
        mimetype: 'image/webp',
        size: info.size,
        width: info.width,
      };
    } catch {
      throw new BadRequestException({
        message: 'Image could not be processed',
        code: 'INVALID_IMAGE_CONTENT',
      });
    }
  }
}
