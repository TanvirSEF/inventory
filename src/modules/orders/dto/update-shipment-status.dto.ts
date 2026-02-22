import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShipmentStatus } from '../orders.types';

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  shipmentStatus!: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Courier picked up from merchant hub' })
  @IsOptional()
  @IsString()
  note?: string;
}
