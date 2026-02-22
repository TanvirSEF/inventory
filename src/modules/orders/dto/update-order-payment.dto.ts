import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { PaymentStatus } from '../orders.types';

export class UpdateOrderPaymentDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Gateway transaction reference for online payments',
    example: 'trx_01JABCXYZ',
  })
  @ValidateIf((value: UpdateOrderPaymentDto) => value.paymentStatus === PaymentStatus.PAID)
  @IsString()
  @MinLength(3)
  transactionRef?: string;
}
