import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController, AdminMediaController } from './media.controller';
import { ImageOptimizationService } from './image-optimization.service';

@Module({
  controllers: [MediaController, AdminMediaController],
  providers: [ImageOptimizationService, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
