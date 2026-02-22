import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CourierProvider, ShipmentStatus } from '../orders.types';

export class CreateShipmentDto {
  @ApiProperty({ enum: CourierProvider, default: CourierProvider.MANUAL })
  @IsEnum(CourierProvider)
  courierProvider!: CourierProvider;

  @ApiPropertyOptional({ enum: ShipmentStatus, default: ShipmentStatus.REQUESTED })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  shipmentStatus?: ShipmentStatus;

  @ApiPropertyOptional({ example: 'PTH-CNS-00012345' })
  @IsOptional()
  @IsString()
  externalConsignmentId?: string;

  @ApiPropertyOptional({ example: 'TRK-OMNI-001' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 120, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @ApiPropertyOptional({ example: 520, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  codAmount?: number;
}
