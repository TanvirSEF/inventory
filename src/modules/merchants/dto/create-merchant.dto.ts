import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({
    description: 'Business name for the merchant account',
    example: 'My Store',
    type: String,
    minLength: 2,
  })
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name is required' })
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  businessName!: string;

  @ApiProperty({
    description: 'Unique subdomain for the merchant (minimum 3 characters)',
    example: 'mystore',
    type: String,
    minLength: 3,
  })
  @IsString({ message: 'Subdomain must be a string' })
  @IsNotEmpty({ message: 'Subdomain is required' })
  @MinLength(3, { message: 'Subdomain must be at least 3 characters' })
  subdomain!: string;
}
