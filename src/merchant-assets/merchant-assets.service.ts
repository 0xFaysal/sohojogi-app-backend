import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { RequestUser } from '../common/types/request-user.type';
import { MerchantAsset, MerchantAssetDocument } from './schemas/merchant-asset.schema';

export interface UploadedMerchantAssetFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  resource_type: string;
  bytes: number;
  format?: string;
}

@Injectable()
export class MerchantAssetsService {
  constructor(
    @InjectModel(MerchantAsset.name)
    private readonly merchantAssetModel: Model<MerchantAssetDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(ownerId: string, field: string, file: UploadedMerchantAssetFile) {
    const upload = await this.uploadToCloudinary(ownerId, field, file);
    const asset = await this.merchantAssetModel.create({
      owner: new Types.ObjectId(ownerId),
      field,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: upload.bytes || file.size,
      publicId: upload.public_id,
      secureUrl: upload.secure_url,
      resourceType: upload.resource_type,
    });

    return {
      id: asset.id,
      url: `/api/v1/merchant-assets/${asset.id}`,
      cloudinaryUrl: asset.secureUrl,
      publicId: asset.publicId,
      field: asset.field,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
    };
  }

  async getForUser(assetId: string, user: RequestUser) {
    const asset = await this.merchantAssetModel.findById(assetId).exec();

    if (!asset) {
      throw new NotFoundException('Merchant asset not found');
    }

    if (!user.roles.includes(Role.Admin) && asset.owner.toString() !== user.userId) {
      throw new ForbiddenException('You are not allowed to view this merchant asset');
    }

    return asset;
  }

  private async uploadToCloudinary(
    ownerId: string,
    field: string,
    file: UploadedMerchantAssetFile,
  ): Promise<CloudinaryUploadResponse> {
    const cloudName = this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.getOrThrow<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = this.configService.get<string>(
      'CLOUDINARY_MERCHANT_FOLDER',
      'sohojogi/merchant-assets',
    );
    const publicId = `${ownerId}/${field}-${Date.now()}`;
    const signature = this.signCloudinaryParams(
      {
        folder,
        public_id: publicId,
        timestamp,
      },
      apiSecret,
    );
    const body = new FormData();

    body.append('api_key', apiKey);
    body.append('timestamp', timestamp);
    body.append('folder', folder);
    body.append('public_id', publicId);
    body.append('signature', signature);
    body.append(
      'file',
      new Blob([file.buffer as unknown as BlobPart], { type: file.mimetype }),
      file.originalname,
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body,
      },
    );
    const data = (await response.json().catch(() => ({}))) as Partial<CloudinaryUploadResponse> & {
      error?: { message?: string };
    };

    if (!response.ok || !data.public_id || !data.secure_url || !data.resource_type) {
      throw new BadGatewayException(
        data.error?.message ?? 'Cloudinary upload failed. Check Cloudinary environment variables.',
      );
    }

    return data as CloudinaryUploadResponse;
  }

  private signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1')
      .update(`${payload}${apiSecret}`)
      .digest('hex');
  }
}
