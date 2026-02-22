import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ example: 'product-image.jpg' })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({ example: 'products', default: 'products' })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ minimum: 60, maximum: 3600, default: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(3600)
  expiresInSeconds?: number;
}
