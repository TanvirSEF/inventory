import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { OrdersService } from '../orders/orders.service';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('store/:subdomain')
  @ApiOperation({
    summary: 'Get public store details by subdomain',
    description:
      'Returns merchant public profile including business name, logo, and selected category details.',
  })
  @ApiParam({
    name: 'subdomain',
    description: 'Merchant subdomain used by storefront',
    example: 'mystore',
  })
  getStore(@Param('subdomain') subdomain: string) {
    return this.publicService.getStoreBySubdomain(subdomain);
  }

  @Get('store/:subdomain/products')
  @ApiOperation({
    summary: 'Get public product list by store subdomain',
    description: 'Returns all products for the merchant mapped to the provided subdomain.',
  })
  @ApiParam({
    name: 'subdomain',
    description: 'Merchant subdomain used by storefront',
    example: 'mystore',
  })
  getStoreProducts(@Param('subdomain') subdomain: string) {
    return this.publicService.getStoreProducts(subdomain);
  }

  @Post('store/:subdomain/orders')
  @ApiOperation({
    summary: 'Create a public storefront order for a specific subdomain',
    description:
      'Accepts customer checkout payload from storefront and creates order in pending status.',
  })
  @ApiParam({
    name: 'subdomain',
    description: 'Merchant subdomain used by storefront',
    example: 'mystore',
  })
  @ApiBody({ type: CreatePublicOrderDto })
  createStoreOrder(
    @Param('subdomain') subdomain: string,
    @Body() dto: CreatePublicOrderDto,
  ) {
    return this.ordersService.createPublicOrder(subdomain, dto);
  }
}
