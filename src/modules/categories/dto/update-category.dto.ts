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

export class UpdateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  name?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  slug?: string;

  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  @IsOptional()
  parentId?: string;

  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsOptional()
  imageUrl?: string;

  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be 0 or greater' })
  @IsOptional()
  sortOrder?: number;
}
