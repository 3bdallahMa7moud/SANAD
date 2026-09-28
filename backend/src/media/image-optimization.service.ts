import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { BadRequestException, Injectable } from '@nestjs/common';
import { imageSize } from 'image-size';
import { Jimp, JimpMime, ResizeStrategy } from 'jimp';

import { MulterFile } from '../common/interfaces';

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 2400;
const MAX_PROCESSING_OUTPUT = 64 * 1024;
const PROCESSING_TIMEOUT_MS = 20_000;
// Package and site images are marketing assets. Keep enough detail for large
// service previews while still delivering a substantially smaller WebP file.
const WEBP_QUALITY = 86;
const runFile = promisify(execFile);

export interface OptimizedWebpImage {
  buffer: Buffer;
  extension: '.webp';
  height: number;
  mimetype: 'image/webp';
  size: number;
  width: number;
}

function boundedDimensions(width: number, height: number) {
  const scale = Math.min(
    1,
    MAX_OUTPUT_DIMENSION / width,
    MAX_OUTPUT_DIMENSION / height,
  );
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function validatedDimensions(buffer: Buffer) {
  const dimensions = imageSize(buffer);
  const width = dimensions.width;
  const height = dimensions.height;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > MAX_INPUT_PIXELS
  ) {
    throw new Error('Image dimensions are invalid or exceed the pixel limit');
  }
  return { height, width };
}

@Injectable()
export class ImageOptimizationService {
  async convertToWebp(file: MulterFile): Promise<OptimizedWebpImage> {
    let workDirectory: string | undefined;
    try {
      const inputDimensions = validatedDimensions(file.buffer);
      let source = file.buffer;
      let outputDimensions = boundedDimensions(
        inputDimensions.width,
        inputDimensions.height,
      );

      // Jimp applies JPEG EXIF orientation and strips metadata. WebP can be
      // passed directly to cwebp, avoiding an unnecessary decode in JS.
      if (file.mimetype !== 'image/webp') {
        const image = await Jimp.read(file.buffer);
        outputDimensions = boundedDimensions(image.width, image.height);
        if (
          image.width !== outputDimensions.width ||
          image.height !== outputDimensions.height
        ) {
          image.resize({
            w: outputDimensions.width,
            h: outputDimensions.height,
            mode: ResizeStrategy.BICUBIC,
          });
        }
        source = await image.getBuffer(JimpMime.png);
      }

      workDirectory = await mkdtemp(join(tmpdir(), 'sanad-image-'));
      const inputPath = join(workDirectory, 'input');
      const outputPath = join(workDirectory, 'output.webp');
      await writeFile(inputPath, source, { mode: 0o600 });

      const resizeArguments =
        file.mimetype === 'image/webp' &&
        (inputDimensions.width !== outputDimensions.width ||
          inputDimensions.height !== outputDimensions.height)
          ? [
              '-resize',
              String(outputDimensions.width),
              String(outputDimensions.height),
            ]
          : [];
      await runFile(
        process.env.CWEBP_PATH?.trim() || 'cwebp',
        [
          '-preset',
          'picture',
          '-quiet',
          '-noasm',
          '-q',
          String(WEBP_QUALITY),
          '-m',
          '6',
          '-metadata',
          'none',
          '-low_memory',
          ...resizeArguments,
          inputPath,
          '-o',
          outputPath,
        ],
        {
          maxBuffer: MAX_PROCESSING_OUTPUT,
          timeout: PROCESSING_TIMEOUT_MS,
        },
      );

      const data = await readFile(outputPath);
      const info = imageSize(data);
      if (
        info.type !== 'webp' ||
        info.width !== outputDimensions.width ||
        info.height !== outputDimensions.height
      ) {
        throw new Error('Image encoder returned unexpected output');
      }

      return {
        buffer: data,
        extension: '.webp',
        height: info.height,
        mimetype: 'image/webp',
        size: data.length,
        width: info.width,
      };
    } catch {
      throw new BadRequestException({
        message: 'Image could not be processed',
        code: 'INVALID_IMAGE_CONTENT',
      });
    } finally {
      if (workDirectory) {
        await rm(workDirectory, { force: true, recursive: true });
      }
    }
  }
}
