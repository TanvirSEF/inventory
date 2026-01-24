import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'merchant@example.com',
    type: String,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    type: String,
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

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

  @ApiProperty({
    description: 'Global category ID selected from available categories',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsString({ message: 'Category ID must be a string' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId!: string;
}
