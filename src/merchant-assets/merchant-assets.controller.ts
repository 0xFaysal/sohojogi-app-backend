import {
  BadRequestException,
  BadGatewayException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import {
  MerchantAssetsService,
  UploadedMerchantAssetFile,
} from './merchant-assets.service';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

@UseGuards(JwtAuthGuard)
@Controller('merchant-assets')
export class MerchantAssetsController {
  constructor(private readonly merchantAssetsService: MerchantAssetsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(new BadRequestException('Only JPG, PNG, and WebP images are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadMerchantAsset(
    @Req() request: { user: RequestUser },
    @UploadedFile() file: UploadedMerchantAssetFile | undefined,
    @Body('field') field = 'merchantDocument',
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.merchantAssetsService.create(request.user.userId, field, file);
  }

  @Get(':assetId')
  @Header('Cache-Control', 'private, max-age=300')
  async getMerchantAsset(
    @Req() request: { user: RequestUser },
    @Param('assetId') assetId: string,
    @Res() response: Response,
  ) {
    const asset = await this.merchantAssetsService.getForUser(assetId, request.user);
    const cloudinaryResponse = await fetch(asset.secureUrl);

    if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
      throw new BadGatewayException('Cloudinary image could not be loaded');
    }

    const image = Buffer.from(await cloudinaryResponse.arrayBuffer());
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Length', image.byteLength.toString());
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${asset.originalName.replace(/"/g, '')}"`,
    );
    response.end(image);
  }
}
