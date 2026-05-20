import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { OrderStatus, PaymentMethod, ApiResponse, IRequestUser } from '@app/common';

// Delivery fee: 15k base + 5k per km
const BASE_DELIVERY_FEE = 15000;
const PER_KM_FEE = 5000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
  ) {}

  // ── Create order from cart ──
  async createFromCart(data: {
    user: IRequestUser;
    deliveryAddress: string;
    deliveryLat: number;
    deliveryLng: number;
    paymentMethod: string;
    note?: string;
    customerName: string;
    customerPhone?: string;
    restaurantLat?: number;
    restaurantLng?: number;
  }) {
    // 1. Consume cart
    const cart = await this.cartService.consumeCart(data.user.userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống, không thể tạo đơn');
    }

    // 2. Calculate delivery distance (Haversine)
    let deliveryDistance = 0;
    if (data.restaurantLat && data.restaurantLng) {
      deliveryDistance = this.haversineDistance(
        data.restaurantLat, data.restaurantLng,
        data.deliveryLat, data.deliveryLng,
      );
    }

    // 3. Calculate fees
    const subtotal = cart.subtotal;
    const deliveryFee = Math.round(BASE_DELIVERY_FEE + deliveryDistance * PER_KM_FEE);
    const discount = 0; // Phase 2+: coupon system
    const total = subtotal + deliveryFee - discount;

    // 4. Determine initial status based on payment method
    const paymentMethod = data.paymentMethod as PaymentMethod;
    const initialStatus = paymentMethod === PaymentMethod.COD
      ? OrderStatus.CONFIRMED // COD skips payment step
      : OrderStatus.PENDING_PAYMENT;

    // 5. Create order
    const order = this.orderRepo.create({
      customerId: data.user.userId,
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      deliveryDistance: parseFloat(deliveryDistance.toFixed(2)),
      subtotal,
      deliveryFee,
      discount,
      total,
      status: initialStatus,
      paymentMethod,
      note: data.note,
      confirmedAt: initialStatus === OrderStatus.CONFIRMED ? new Date() : undefined,
    });

    const savedOrder = await this.orderRepo.save(order);

    // 6. Create order items
    const items = cart.items.map((cartItem) => {
      const optionExtra = cartItem.selectedOptions.reduce((s, o) => s + o.extraPrice, 0);
      return this.itemRepo.create({
        orderId: savedOrder.id,
        menuItemId: cartItem.menuItemId,
        name: cartItem.name,
        unitPrice: cartItem.unitPrice,
        quantity: cartItem.quantity,
        totalPrice: (cartItem.unitPrice + optionExtra) * cartItem.quantity,
        image: cartItem.image,
        selectedOptions: cartItem.selectedOptions,
        specialNote: cartItem.specialNote,
      });
    });

    await this.itemRepo.save(items);

    this.logger.log(
      `Order created: ${savedOrder.id} | ${cart.items.length} items | ${total.toLocaleString()}đ | ${paymentMethod}`,
    );

    // Reload with items
    return this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items'],
    });
  }

  // ── Get by ID ──
  async getById(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    return order;
  }

  // ── List by customer ──
  async listByCustomer(query: { userId: string; page: number; limit: number; status?: string }) {
    const where: any = { customerId: query.userId };
    if (query.status) where.status = query.status;

    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.limit || 10),
      take: query.limit || 10,
      relations: ['items'],
    });

    return ApiResponse.paginated(orders, total, query.page || 1, query.limit || 10);
  }

  // ── List by restaurant ──
  async listByRestaurant(query: { restaurantId: string; userId: string; page: number; limit: number; status?: string }) {
    const where: any = { restaurantId: query.restaurantId };
    if (query.status) where.status = query.status;

    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.limit || 10),
      take: query.limit || 10,
      relations: ['items'],
    });

    return ApiResponse.paginated(orders, total, query.page || 1, query.limit || 10);
  }

  // ── Cancel ──
  async cancel(data: { orderId: string; userId: string; reason: string }) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Only customer who owns the order can cancel
    if (order.customerId !== data.userId) {
      throw new ForbiddenException('Bạn không có quyền huỷ đơn này');
    }

    // Can only cancel before PREPARING
    const cancellableStatuses = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('Không thể huỷ đơn ở trạng thái hiện tại');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = data.reason;
    order.cancelledAt = new Date();
    await this.orderRepo.save(order);

    this.logger.log(`Order cancelled: ${order.id} | Reason: ${data.reason}`);
    return order;
  }

  // ── Update status (restaurant owner / admin / driver) ──
  async updateStatus(data: { orderId: string; userId: string; status: string; role: string }) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    const newStatus = data.status as OrderStatus;

    // Validate status transition
    if (!this.isValidTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${order.status} sang ${newStatus}`,
      );
    }

    order.status = newStatus;

    // Set timestamps
    switch (newStatus) {
      case OrderStatus.CONFIRMED: order.confirmedAt = new Date(); break;
      case OrderStatus.READY: order.preparedAt = new Date(); break;
      case OrderStatus.PICKED_UP: order.pickedUpAt = new Date(); break;
      case OrderStatus.DELIVERED: order.deliveredAt = new Date(); break;
      case OrderStatus.CANCELLED: order.cancelledAt = new Date(); break;
    }

    await this.orderRepo.save(order);
    this.logger.log(`Order ${order.id}: ${order.status} → ${newStatus}`);
    return order;
  }

  // ── Mark as paid (called by payment-service via Gateway) ──
  async markAsPaid(orderId: string, paymentId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    order.status = OrderStatus.CONFIRMED;
    order.paymentId = paymentId;
    order.confirmedAt = new Date();
    await this.orderRepo.save(order);

    this.logger.log(`Order paid & confirmed: ${order.id} | Payment: ${paymentId}`);
    return order;
  }

  // ══════════ DRIVER METHODS ══════════

  /** Orders ready for pickup (no driver assigned yet) */
  async driverAvailableOrders(query: { page: number; limit: number }) {
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { status: OrderStatus.READY, driverId: null as any },
      order: { createdAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.limit || 10),
      take: query.limit || 10,
      relations: ['items'],
    });
    return ApiResponse.paginated(orders, total, query.page || 1, query.limit || 10);
  }

  /** Orders currently assigned to this driver (active deliveries) */
  async driverMyDeliveries(driverId: string) {
    const orders = await this.orderRepo.find({
      where: [
        { driverId, status: OrderStatus.PICKED_UP },
        { driverId, status: OrderStatus.READY },
      ],
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });
    return orders;
  }

  /** Driver accepts an order */
  async driverAcceptOrder(data: { orderId: string; driverId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Đơn hàng chưa sẵn sàng để giao');
    }
    if (order.driverId) {
      throw new BadRequestException('Đơn hàng đã có tài xế nhận');
    }
    order.driverId = data.driverId;
    await this.orderRepo.save(order);
    this.logger.log(`Driver ${data.driverId} accepted order ${order.id}`);
    return order;
  }

  /** Driver picked up the order */
  async driverPickupOrder(data: { orderId: string; driverId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId, driverId: data.driverId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại hoặc không phải của bạn');
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Đơn chưa sẵn sàng để lấy');
    }
    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();
    await this.orderRepo.save(order);
    this.logger.log(`Driver ${data.driverId} picked up order ${order.id}`);
    return order;
  }

  /** Driver delivered the order */
  async driverDeliverOrder(data: { orderId: string; driverId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId, driverId: data.driverId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại hoặc không phải của bạn');
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('Đơn chưa được lấy');
    }
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    await this.orderRepo.save(order);
    this.logger.log(`Driver ${data.driverId} delivered order ${order.id}`);
    return order;
  }

  /** Driver delivery history */
  async driverHistory(query: { driverId: string; page: number; limit: number }) {
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { driverId: query.driverId, status: OrderStatus.DELIVERED },
      order: { deliveredAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.limit || 10),
      take: query.limit || 10,
      relations: ['items'],
    });
    return ApiResponse.paginated(orders, total, query.page || 1, query.limit || 10);
  }

  /** Driver earnings summary */
  async driverEarnings(driverId: string) {
    // Total deliveries + total earned delivery fees
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'totalDeliveries')
      .addSelect('COALESCE(SUM(o.deliveryFee), 0)', 'totalEarnings')
      .where('o.driverId = :driverId', { driverId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    // Today's earnings
    const today = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'todayDeliveries')
      .addSelect('COALESCE(SUM(o.deliveryFee), 0)', 'todayEarnings')
      .where('o.driverId = :driverId', { driverId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.deliveredAt >= CURRENT_DATE')
      .getRawOne();

    return {
      totalDeliveries: parseInt(result.totalDeliveries) || 0,
      totalEarnings: parseInt(result.totalEarnings) || 0,
      todayDeliveries: parseInt(today.todayDeliveries) || 0,
      todayEarnings: parseInt(today.todayEarnings) || 0,
    };
  }

  // ── Helpers ──
  private isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const transitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.PICKED_UP],
      [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERED],
    };
    return transitions[from]?.includes(to) ?? false;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
