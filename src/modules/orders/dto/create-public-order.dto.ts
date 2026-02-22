import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../orders.types';

class CreatePublicOrderItemDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity for product', minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: 'House 12, Road 5' })
  @IsString()
  @IsNotEmpty()
  line1!: string;

  @ApiPropertyOptional({ example: '2nd Floor' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Mirpur DOHS' })
  @IsString()
  @IsNotEmpty()
  area!: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: '1216' })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', default: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreatePublicOrderDto {
  @ApiProperty({ example: 'Tanvir Ahmed' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: '01700112233' })
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/)
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'tanvir@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ example: 'Please deliver after 6 PM' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePublicOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderItemDto)
  items!: CreatePublicOrderItemDto[];
}
