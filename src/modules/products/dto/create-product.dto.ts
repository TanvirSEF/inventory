import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ description: 'Name of the product' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Detailed description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Base price of the product' })
    @IsNumber()
    @Min(0)
    base_price: number;

    @ApiProperty({ description: 'Current stock level' })
    @IsNumber()
    @Min(0)
    stock_level: number;

    @ApiProperty({
        description: 'Dynamic attributes based on category schema (key-value pairs)',
        example: { size: 'M', material: 'Cotton' }
    })
    @IsObject()
    attributes: Record<string, any>;

    @ApiProperty({ description: 'Array of image URLs', required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    image_urls?: string[];
}
