import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import {
  CourierProvider,
  MerchantRecord,
  OrderLogActorType,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductRecord,
  ShipmentStatus,
} from './orders.types';

interface OrderItemRecord {
  id: string;
  product_id: string;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    try {
      return this.supabase.adminClient;
    } catch {
      return this.supabase.client;
    }
  }

  async createPublicOrder(subdomain: string, dto: CreatePublicOrderDto) {
    const merchant = await this.getMerchantBySubdomain(subdomain);

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const { data: products, error: productsError } = await this.db
      .from('products')
      .select('*')
      .eq('merchant_id', merchant.id)
      .in('id', productIds);

    if (productsError) {
      throw new BadRequestException(productsError.message);
    }

    const productMap = new Map<string, ProductRecord>();
    (products || []).forEach((product) => {
      productMap.set(product.id as string, product as ProductRecord);
    });

    const missingProduct = productIds.find((productId) => !productMap.has(productId));
    if (missingProduct) {
      throw new NotFoundException(`Product not found: ${missingProduct}`);
    }

    let subtotal = 0;
    const orderItemsPayload = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;

      if (product.stock_level < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }

      const lineTotal = Number(product.base_price) * item.quantity;
      subtotal += lineTotal;

      return {
        merchant_id: merchant.id,
        product_id: product.id,
        product_name_snapshot: product.name,
        product_description_snapshot: product.description || null,
        product_attributes_snapshot: product.attributes || {},
        product_image_urls_snapshot: product.image_urls || [],
        unit_price: Number(product.base_price),
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const orderNumber = await this.generateOrderNumber(merchant.id);
    const discount = 0;
    const deliveryCharge = 0;
    const total = subtotal - discount + deliveryCharge;

    const { data: order, error: orderError } = await this.db
      .from('orders')
      .insert({
        merchant_id: merchant.id,
        order_number: orderNumber,
        source: 'storefront',
        customer_name: dto.customerName,
        customer_email: dto.customerEmail || null,
        customer_phone: dto.customerPhone,
        shipping_address: {
          ...dto.shippingAddress,
          country: dto.shippingAddress.country || 'Bangladesh',
        },
        status: OrderStatus.PENDING,
        payment_method: dto.paymentMethod,
        payment_status:
          dto.paymentMethod === PaymentMethod.COD
            ? PaymentStatus.UNPAID
            : PaymentStatus.UNPAID,
        subtotal,
        discount,
        delivery_charge: deliveryCharge,
        total,
        notes: dto.notes || null,
      })
      .select('*')
      .single();

    if (orderError || !order) {
      throw new BadRequestException(orderError?.message || 'Failed to create order');
    }

    const { data: orderItems, error: orderItemsError } = await this.db
      .from('order_items')
      .insert(
        orderItemsPayload.map((item) => ({
          ...item,
          order_id: order.id,
        })),
      )
      .select('*');

    if (orderItemsError) {
      await this.db.from('orders').delete().eq('id', order.id);
      throw new BadRequestException(orderItemsError.message);
    }

    await this.addOrderStatusLog({
      orderId: order.id,
      merchantId: merchant.id,
      fromStatus: null,
      toStatus: OrderStatus.PENDING,
      actorType: OrderLogActorType.SYSTEM,
      note: 'Order created from storefront',
      metadata: {
        source: 'storefront',
        paymentMethod: dto.paymentMethod,
      },
    });

    return {
      order,
      items: orderItems || [],
      message: 'Order created successfully',
    };
  }

  async getOrderSummaryForMerchant(ownerId: string) {
    const merchant = await this.getMerchantByOwner(ownerId);

    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: confirmedOrders },
      { count: packedOrders },
      { count: shippedOrders },
      { count: deliveredOrders },
      { count: cancelledOrders },
      { count: returnedOrders },
      { count: paidOrders },
    ] = await Promise.all([
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.PENDING),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.CONFIRMED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.PACKED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.SHIPPED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.DELIVERED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.CANCELLED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', OrderStatus.RETURNED),
      this.db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('payment_status', PaymentStatus.PAID),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentOrders, error: recentOrdersError } = await this.db
      .from('orders')
      .select('total')
      .eq('merchant_id', merchant.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentOrdersError) {
      throw new BadRequestException(recentOrdersError.message);
    }

    const grossRevenue = (recentOrders || []).reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    return {
      totals: {
        orders: totalOrders || 0,
        paid: paidOrders || 0,
        grossRevenue,
      },
      byStatus: {
        pending: pendingOrders || 0,
        confirmed: confirmedOrders || 0,
        packed: packedOrders || 0,
        shipped: shippedOrders || 0,
        delivered: deliveredOrders || 0,
        cancelled: cancelledOrders || 0,
        returned: returnedOrders || 0,
      },
    };
  }

  async listOrdersForMerchant(ownerId: string, query: ListOrdersQueryDto) {
    const merchant = await this.getMerchantByOwner(ownerId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = this.db
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
      dbQuery = dbQuery.or(
        `order_number.ilike.%${query.search}%,customer_name.ilike.%${query.search}%,customer_phone.ilike.%${query.search}%`,
      );
    }

    const { data, error, count } = await dbQuery.range(from, to);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getOrderForMerchant(orderId: string, ownerId: string) {
    const merchant = await this.getMerchantByOwner(ownerId);

    const { data: order, error: orderError } = await this.db
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .single();

    if (orderError || !order) {
      throw new NotFoundException('Order not found');
    }

    const { data: items, error: itemsError } = await this.db
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new BadRequestException(itemsError.message);
    }

    return {
      ...order,
      items: items || [],
    };
  }

  async getOrderTimelineForMerchant(orderId: string, ownerId: string) {
    const merchant = await this.getMerchantByOwner(ownerId);
    await this.getOrderForMerchant(orderId, ownerId);

    const { data, error } = await this.db
      .from('order_status_logs')
      .select('*')
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  async getShipmentForMerchant(orderId: string, ownerId: string) {
    const merchant = await this.getMerchantByOwner(ownerId);
    await this.getOrderForMerchant(orderId, ownerId);

    const { data, error } = await this.db
      .from('courier_shipments')
      .select('*')
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id)
      .single();

    if (error) {
      throw new NotFoundException('Shipment not created for this order');
    }

    return data;
  }

  async createOrUpdateShipmentForMerchant(
    orderId: string,
    ownerId: string,
    dto: CreateShipmentDto,
  ) {
    const merchant = await this.getMerchantByOwner(ownerId);
    await this.getOrderForMerchant(orderId, ownerId);

    const { data, error } = await this.db
      .from('courier_shipments')
      .upsert(
        {
          order_id: orderId,
          merchant_id: merchant.id,
          courier_provider: dto.courierProvider,
          shipment_status: dto.shipmentStatus || ShipmentStatus.REQUESTED,
          external_consignment_id: dto.externalConsignmentId || null,
          tracking_number: dto.trackingNumber || null,
          shipping_fee: dto.shippingFee ?? 0,
          cod_amount: dto.codAmount ?? 0,
        },
        { onConflict: 'order_id' },
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message || 'Failed to create shipment');
    }

    await this.addOrderStatusLog({
      orderId,
      merchantId: merchant.id,
      fromStatus: null,
      toStatus: (await this.getOrderForMerchant(orderId, ownerId)).status,
      actorType: OrderLogActorType.MERCHANT,
      actorId: ownerId,
      note: 'Shipment created/updated',
      metadata: {
        courierProvider: dto.courierProvider,
        shipmentStatus: dto.shipmentStatus || ShipmentStatus.REQUESTED,
        trackingNumber: dto.trackingNumber || null,
      },
    });

    return {
      message: 'Shipment upserted successfully',
      shipment: data,
    };
  }

  async updateShipmentStatusForMerchant(
    orderId: string,
    ownerId: string,
    dto: UpdateShipmentStatusDto,
  ) {
    const merchant = await this.getMerchantByOwner(ownerId);
    const order = await this.getOrderForMerchant(orderId, ownerId);

    const { data: shipment, error: shipmentError } = await this.db
      .from('courier_shipments')
      .select('*')
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id)
      .single();

    if (shipmentError || !shipment) {
      throw new NotFoundException('Shipment not found for this order');
    }

    const { data: updatedShipment, error: updateError } = await this.db
      .from('courier_shipments')
      .update({ shipment_status: dto.shipmentStatus })
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id)
      .select('*')
      .single();

    if (updateError || !updatedShipment) {
      throw new BadRequestException(updateError?.message || 'Failed to update shipment status');
    }

    await this.addOrderStatusLog({
      orderId,
      merchantId: merchant.id,
      fromStatus: order.status,
      toStatus: order.status,
      actorType: OrderLogActorType.MERCHANT,
      actorId: ownerId,
      note: dto.note || 'Shipment status updated',
      metadata: {
        previousShipmentStatus: shipment.shipment_status,
        shipmentStatus: dto.shipmentStatus,
      },
    });

    return {
      message: 'Shipment status updated successfully',
      shipment: updatedShipment,
    };
  }

  async updateOrderStatusForMerchant(
    orderId: string,
    ownerId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const merchant = await this.getMerchantByOwner(ownerId);

    const { data: order, error: orderError } = await this.db
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .single();

    if (orderError || !order) {
      throw new NotFoundException('Order not found');
    }

    const currentOrder = order as OrderRecord & {
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      delivered_at?: string | null;
    };

    this.ensureValidTransition(currentOrder.status, dto.status);

    if (dto.status === OrderStatus.CANCELLED && !dto.cancellationReason) {
      throw new BadRequestException('Cancellation reason is required');
    }

    if (dto.status === OrderStatus.RETURNED && !dto.returnReason) {
      throw new BadRequestException('Return reason is required');
    }

    if (dto.status === OrderStatus.RETURNED) {
      if (!currentOrder.delivered_at) {
        throw new BadRequestException('Only delivered orders can be returned');
      }

      const deliveredAt = new Date(currentOrder.delivered_at);
      const now = new Date();
      const diffDays = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        throw new BadRequestException('Return window expired (7 days)');
      }
    }

    const { data: orderItems, error: orderItemsError } = await this.db
      .from('order_items')
      .select('id, product_id, quantity')
      .eq('order_id', orderId)
      .eq('merchant_id', merchant.id);

    if (orderItemsError) {
      throw new BadRequestException(orderItemsError.message);
    }

    const items = (orderItems || []) as OrderItemRecord[];

    const stockWasDeducted = [
      OrderStatus.CONFIRMED,
      OrderStatus.PACKED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.RETURNED,
    ].includes(currentOrder.status);

    if (currentOrder.status === OrderStatus.PENDING && dto.status === OrderStatus.CONFIRMED) {
      await this.adjustStockLevels(merchant.id, items, 'decrease');
    }

    if (
      dto.status === OrderStatus.CANCELLED &&
      stockWasDeducted &&
      currentOrder.status !== OrderStatus.RETURNED
    ) {
      await this.adjustStockLevels(merchant.id, items, 'increase');
    }

    if (dto.status === OrderStatus.RETURNED) {
      await this.adjustStockLevels(merchant.id, items, 'increase');
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: dto.status,
      cancellation_reason:
        dto.status === OrderStatus.CANCELLED ? dto.cancellationReason || null : null,
      return_reason: dto.status === OrderStatus.RETURNED ? dto.returnReason || null : null,
      return_requested_at: dto.status === OrderStatus.RETURNED ? nowIso : null,
      payment_status:
        dto.status === OrderStatus.DELIVERED &&
        currentOrder.payment_method === PaymentMethod.COD
          ? PaymentStatus.PAID
          : currentOrder.payment_status,
    };

    if (dto.status === OrderStatus.CONFIRMED) updatePayload.confirmed_at = nowIso;
    if (dto.status === OrderStatus.PACKED) updatePayload.packed_at = nowIso;
    if (dto.status === OrderStatus.SHIPPED) updatePayload.shipped_at = nowIso;
    if (dto.status === OrderStatus.DELIVERED) updatePayload.delivered_at = nowIso;
    if (dto.status === OrderStatus.CANCELLED) updatePayload.cancelled_at = nowIso;
    if (dto.status === OrderStatus.RETURNED) updatePayload.returned_at = nowIso;

    const { data: updatedOrder, error: updateError } = await this.db
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .select('*')
      .single();

    if (updateError || !updatedOrder) {
      throw new BadRequestException(updateError?.message || 'Failed to update order');
    }

    await this.addOrderStatusLog({
      orderId,
      merchantId: merchant.id,
      fromStatus: currentOrder.status,
      toStatus: dto.status,
      actorType: OrderLogActorType.MERCHANT,
      actorId: ownerId,
      note: dto.note || null,
      metadata: {
        cancellationReason: dto.cancellationReason || null,
        returnReason: dto.returnReason || null,
      },
    });

    return {
      message: 'Order status updated successfully',
      order: updatedOrder,
    };
  }

  async updateOrderPaymentForMerchant(
    orderId: string,
    ownerId: string,
    dto: UpdateOrderPaymentDto,
  ) {
    const merchant = await this.getMerchantByOwner(ownerId);

    const { data: order, error: orderError } = await this.db
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .single();

    if (orderError || !order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.paymentStatus === PaymentStatus.PAID && !dto.transactionRef) {
      throw new BadRequestException('transactionRef is required when payment is marked paid');
    }

    const updatePayload: Record<string, unknown> = {
      payment_status: dto.paymentStatus,
      transaction_ref:
        dto.paymentStatus === PaymentStatus.PAID
          ? dto.transactionRef
          : order.transaction_ref,
      paid_at: dto.paymentStatus === PaymentStatus.PAID ? new Date().toISOString() : null,
    };

    const { data: updatedOrder, error: updateError } = await this.db
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .select('*')
      .single();

    if (updateError || !updatedOrder) {
      throw new BadRequestException(updateError?.message || 'Failed to update payment status');
    }

    await this.addOrderStatusLog({
      orderId,
      merchantId: merchant.id,
      fromStatus: order.status as OrderStatus,
      toStatus: order.status as OrderStatus,
      actorType: OrderLogActorType.MERCHANT,
      actorId: ownerId,
      note: 'Payment status updated',
      metadata: {
        previousPaymentStatus: order.payment_status,
        paymentStatus: dto.paymentStatus,
        transactionRef: dto.transactionRef || null,
      },
    });

    return {
      message: 'Order payment status updated successfully',
      order: updatedOrder,
    };
  }

  private async getMerchantBySubdomain(subdomain: string): Promise<MerchantRecord> {
    const { data, error } = await this.db
      .from('merchants')
      .select('id, owner_id, business_name, subdomain, is_active')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Store not found');
    }

    return data as MerchantRecord;
  }

  private async getMerchantByOwner(ownerId: string): Promise<MerchantRecord> {
    const { data, error } = await this.db
      .from('merchants')
      .select('id, owner_id, business_name, subdomain, is_active')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Merchant account not found');
    }

    return data as MerchantRecord;
  }

  private async generateOrderNumber(merchantId: string): Promise<string> {
    const today = new Date();
    const yyyymm = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
    const prefix = `ORD-${yyyymm}-`;

    const { data, error } = await this.db
      .from('orders')
      .select('order_number')
      .eq('merchant_id', merchantId)
      .like('order_number', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new BadRequestException('Failed to generate order number');
    }

    const lastOrderNumber = data?.[0]?.order_number as string | undefined;
    const lastSequence = lastOrderNumber
      ? Number.parseInt(lastOrderNumber.split('-').pop() || '0', 10)
      : 0;
    const nextSequence = String(lastSequence + 1).padStart(4, '0');

    return `${prefix}${nextSequence}`;
  }

  private ensureValidTransition(current: OrderStatus, next: OrderStatus) {
    if (current === next) {
      throw new BadRequestException(`Order already in status: ${current}`);
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private async adjustStockLevels(
    merchantId: string,
    items: OrderItemRecord[],
    action: 'increase' | 'decrease',
  ) {
    for (const item of items) {
      if (action === 'decrease') {
        let updated = false;

        // Optimistic concurrency-safe decrement (retry on conflict)
        for (let attempt = 0; attempt < 3 && !updated; attempt++) {
          const { data: product, error: productError } = await this.db
            .from('products')
            .select('id, stock_level')
            .eq('id', item.product_id)
            .eq('merchant_id', merchantId)
            .single();

          if (productError || !product) {
            throw new BadRequestException(`Product not found: ${item.product_id}`);
          }

          const currentStock = Number(product.stock_level);
          const nextStock = currentStock - item.quantity;

          if (nextStock < 0) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.product_id}`,
            );
          }

          const { data: updatedRows, error: updateError } = await this.db
            .from('products')
            .update({ stock_level: nextStock })
            .eq('id', item.product_id)
            .eq('merchant_id', merchantId)
            .eq('stock_level', currentStock)
            .select('id');

          if (updateError) {
            throw new BadRequestException(updateError.message);
          }

          updated = !!updatedRows && updatedRows.length > 0;
        }

        if (!updated) {
          throw new BadRequestException(
            `Could not reserve stock for product ${item.product_id}. Please retry.`,
          );
        }
      } else {
        const { data: product, error: productError } = await this.db
          .from('products')
          .select('id, stock_level')
          .eq('id', item.product_id)
          .eq('merchant_id', merchantId)
          .single();

        if (productError || !product) {
          throw new BadRequestException(`Product not found: ${item.product_id}`);
        }

        const nextStock = Number(product.stock_level) + item.quantity;

        const { error: updateError } = await this.db
          .from('products')
          .update({ stock_level: nextStock })
          .eq('id', item.product_id)
          .eq('merchant_id', merchantId);

        if (updateError) {
          throw new BadRequestException(updateError.message);
        }
      }
    }
  }

  private async addOrderStatusLog(params: {
    orderId: string;
    merchantId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    actorType: OrderLogActorType;
    actorId?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.db.from('order_status_logs').insert({
      order_id: params.orderId,
      merchant_id: params.merchantId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      note: params.note || null,
      metadata: params.metadata || {},
    });

    if (error) {
      throw new BadRequestException(`Failed to write order timeline log: ${error.message}`);
    }
  }
}
