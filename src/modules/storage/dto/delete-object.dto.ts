import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteObjectDto {
  @ApiProperty({
    example: 'merchants/3b88f2a9-4126-43aa-ad25-11f4f4f84cd8/products/1700000000000-image.jpg',
  })
  @IsString()
  key!: string;
}
