import {
  IsString,
  IsOptional,
  MinLength,
  IsUrl,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Electronics',
    type: String,
    minLength: 2,
  })
  @IsString({ message: 'Category name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Electronic devices and accessories',
    type: String,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'electronics',
    type: String,
    minLength: 2,
  })
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID (for hierarchical categories)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Category image URL',
    example: 'https://example.com/images/electronics.jpg',
    type: String,
    format: 'uri',
  })
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    type: Boolean,
  })
  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 0,
    type: Number,
    minimum: 0,
  })
  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be 0 or greater' })
  @IsOptional()
  sortOrder?: number;
}
