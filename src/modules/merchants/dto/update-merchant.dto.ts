import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateMerchantDto {
  @IsString({ message: 'Business name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  businessName?: string;

  @IsString({ message: 'Subdomain must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'Subdomain must be at least 3 characters' })
  subdomain?: string;
}
