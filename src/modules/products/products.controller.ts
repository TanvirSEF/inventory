import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { MerchantGuard } from '../../common/guards/merchant.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, MerchantGuard)
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new product with dynamic attributes' })
    create(
        @CurrentMerchant() merchant: any,
        @Body() createProductDto: CreateProductDto,
    ) {
        return this.productsService.create(merchant.id, createProductDto);
    }
}
