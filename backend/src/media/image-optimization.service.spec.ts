import { BadRequestException } from '@nestjs/common';
import { imageSize } from 'image-size';
import { Jimp, JimpMime } from 'jimp';
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
    const source = await new Jimp({
      width: 2500,
      height: 1250,
      color: 0x0a2a4aff,
    }).getBuffer(JimpMime.png);

    const result = await service.convertToWebp(imageFile(source));
    const metadata = imageSize(result.buffer);

    expect(result.extension).toBe('.webp');
    expect(result.mimetype).toBe('image/webp');
    expect(result.size).toBe(result.buffer.length);
    expect(metadata.type).toBe('webp');
    expect(metadata.width).toBe(2400);
    expect(metadata.height).toBe(1200);
    expect(result.buffer.includes(Buffer.from('EXIF'))).toBe(false);
  }, 30_000);

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
