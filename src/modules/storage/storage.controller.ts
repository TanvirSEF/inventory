import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { DeleteObjectDto } from './dto/delete-object.dto';
import { StorageService } from './storage.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { MerchantGuard } from '../../common/guards/merchant.guard';

@ApiTags('storage')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, MerchantGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post(':merchantId/presign-upload')
  @ApiOperation({ summary: 'Generate signed upload URL for Cloudflare R2' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  createUploadUrl(
    @Param('merchantId') merchantId: string,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.storageService.createUploadUrl(merchantId, dto);
  }

  @Delete(':merchantId/object')
  @ApiOperation({ summary: 'Delete object from Cloudflare R2 for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  removeObject(
    @Param('merchantId') merchantId: string,
    @Body() dto: DeleteObjectDto,
  ) {
    return this.storageService.deleteObject(merchantId, dto.key);
  }
}
