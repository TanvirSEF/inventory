import { Controller, Get, Param, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get order summary stats for authenticated merchant' })
  getSummary(@CurrentUser() user: User) {
    return this.ordersService.getOrderSummaryForMerchant(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders for the authenticated merchant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  listOrders(@CurrentUser() user: User, @Query() query: ListOrdersQueryDto) {
    return this.ordersService.listOrdersForMerchant(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID for the authenticated merchant' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getOrder(@Param('id') orderId: string, @CurrentUser() user: User) {
    return this.ordersService.getOrderForMerchant(orderId, user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get order timeline/audit logs by order ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getOrderTimeline(@Param('id') orderId: string, @CurrentUser() user: User) {
    return this.ordersService.getOrderTimelineForMerchant(orderId, user.id);
  }

  @Get(':id/shipment')
  @ApiOperation({ summary: 'Get shipment details for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getOrderShipment(@Param('id') orderId: string, @CurrentUser() user: User) {
    return this.ordersService.getShipmentForMerchant(orderId, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status for the authenticated merchant' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  updateStatus(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatusForMerchant(orderId, user.id, dto);
  }

  @Patch(':id/payment-status')
  @ApiOperation({ summary: 'Update payment status for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  updatePaymentStatus(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateOrderPaymentDto,
  ) {
    return this.ordersService.updateOrderPaymentForMerchant(orderId, user.id, dto);
  }

  @Patch(':id/shipment/status')
  @ApiOperation({ summary: 'Update shipment status for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  updateShipmentStatus(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.ordersService.updateShipmentStatusForMerchant(orderId, user.id, dto);
  }

  @Patch(':id/shipment')
  @ApiOperation({ summary: 'Create shipment for an order (idempotent upsert)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  createOrUpdateShipment(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.ordersService.createOrUpdateShipmentForMerchant(orderId, user.id, dto);
  }
}
