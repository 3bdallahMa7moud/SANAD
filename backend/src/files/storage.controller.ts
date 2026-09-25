import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators';
import { PUBLIC_MEDIA_CACHE_CONTROL, StorageService } from './storage.service';

@Public()
@ApiExcludeController()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('local')
  downloadLocalFile(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() response: Response,
  ) {
    const filePath = this.storageService.getVerifiedLocalPath(
      key,
      expires,
      signature,
    );
    return response.sendFile(filePath);
  }

  @Get('public')
  downloadPublicMedia(@Query('key') key: string, @Res() response: Response) {
    const filePath = this.storageService.getPublicLocalMediaPath(key);
    response.setHeader('Cache-Control', PUBLIC_MEDIA_CACHE_CONTROL);
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.sendFile(filePath);
  }
}
