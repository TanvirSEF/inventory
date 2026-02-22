import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { OrderStatus } from '../orders.types';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Required when status is cancelled',
    example: 'Customer changed mind',
  })
  @ValidateIf((value: UpdateOrderStatusDto) => value.status === OrderStatus.CANCELLED)
  @IsString()
  @MinLength(3)
  cancellationReason?: string;

  @ApiPropertyOptional({
    description: 'Required when status is returned',
    example: 'Damaged product received',
  })
  @ValidateIf((value: UpdateOrderStatusDto) => value.status === OrderStatus.RETURNED)
  @IsString()
  @MinLength(3)
  returnReason?: string;

  @ApiPropertyOptional({
    description: 'Optional internal/admin note for this transition',
    example: 'Courier handover completed',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
