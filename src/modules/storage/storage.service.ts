import { BadRequestException, Injectable } from '@nestjs/common';
import { R2Service } from '../../core/storage/r2.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Injectable()
export class StorageService {
  constructor(private readonly r2Service: R2Service) {}

  async createUploadUrl(merchantId: string, dto: CreateUploadUrlDto) {
    const folder = this.normalizeFolder(dto.folder || 'products');
    const safeName = this.sanitizeFileName(dto.fileName);
    const key = `merchants/${merchantId}/${folder}/${Date.now()}-${safeName}`;

    return this.r2Service.generateUploadSignedUrl(
      key,
      dto.contentType,
      dto.expiresInSeconds || 300,
    );
  }

  async deleteObject(merchantId: string, key: string) {
    if (!key.startsWith(`merchants/${merchantId}/`)) {
      throw new BadRequestException('Invalid object key for this merchant');
    }

    return this.r2Service.deleteObject(key);
  }

  private sanitizeFileName(fileName: string) {
    return fileName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '');
  }

  private normalizeFolder(folder: string) {
    return folder
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9/_-]/g, '');
  }
}
