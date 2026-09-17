import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { MulterFile } from '../common/interfaces';
import { ImageOptimizationService } from './image-optimization.service';

function imageFile(buffer: Buffer): MulterFile {
  return {
    fieldname: 'file',
    originalname: 'service-image.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    buffer,
  };
}

describe('ImageOptimizationService', () => {
  const service = new ImageOptimizationService();

  it('converts and bounds uploaded images as metadata-free WebP', async () => {
    const source = await sharp({
      create: {
        width: 3000,
        height: 1500,
        channels: 3,
        background: '#0a2a4a',
      },
    })
      .png()
      .toBuffer();

    const result = await service.convertToWebp(imageFile(source));
    const metadata = await sharp(result.buffer).metadata();

    expect(result.extension).toBe('.webp');
    expect(result.mimetype).toBe('image/webp');
    expect(result.size).toBe(result.buffer.length);
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(2400);
    expect(metadata.height).toBe(1200);
    expect(metadata.exif).toBeUndefined();
  });

  it('rejects corrupt image data that passed the initial signature check', async () => {
    await expect(
      service.convertToWebp(
        imageFile(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
