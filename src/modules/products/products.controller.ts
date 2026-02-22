import { Controller, Post, Body, UseGuards, Get, Query, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { MerchantGuard } from '../../common/guards/merchant.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, MerchantGuard)
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a specific product' })
    remove(@Param('id') id: string, @CurrentMerchant() merchant: any) {
        return this.productsService.remove(id, merchant.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a specific product' })
    @ApiBody({ type: UpdateProductDto })
    update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @CurrentMerchant() merchant: any,
    ) {
        return this.productsService.update(id, merchant.id, updateProductDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get details of a specific product' })
    findOne(@Param('id') id: string, @CurrentMerchant() merchant: any) {
        return this.productsService.findOne(id, merchant.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all products for the current merchant with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    findAll(
        @CurrentMerchant() merchant: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.productsService.findAll(
            merchant.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            search,
        );
    }

    @Post()
    @ApiOperation({ summary: 'Create a new product with dynamic attributes' })
    create(
        @CurrentMerchant() merchant: any,
        @Body() createProductDto: CreateProductDto,
    ) {
        return this.productsService.create(merchant.id, createProductDto);
    }
}
