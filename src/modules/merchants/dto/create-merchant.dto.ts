import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateMerchantDto {
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name is required' })
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  businessName!: string;

  @IsString({ message: 'Subdomain must be a string' })
  @IsNotEmpty({ message: 'Subdomain is required' })
  @MinLength(3, { message: 'Subdomain must be at least 3 characters' })
  subdomain!: string;
}
