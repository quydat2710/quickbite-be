import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern(MSG_PATTERNS.ORDER_CREATE)
  async create(@Payload() data: any) {
    return this.ordersService.createFromCart(data);
  }

  @MessagePattern(MSG_PATTERNS.ORDER_GET)
  async getById(@Payload() data: { orderId: string; userId: string }) {
    return this.ordersService.getById(data.orderId, data.userId);
  }

  @MessagePattern(MSG_PATTERNS.ORDER_LIST)
  async listByCustomer(@Payload() data: { userId: string; page: number; limit: number; status?: string }) {
    return this.ordersService.listByCustomer(data);
  }

  @MessagePattern(MSG_PATTERNS.ORDER_LIST_RESTAURANT)
  async listByRestaurant(@Payload() data: { restaurantId: string; userId: string; page: number; limit: number; status?: string }) {
    return this.ordersService.listByRestaurant(data);
  }

  @MessagePattern(MSG_PATTERNS.ORDER_CANCEL)
  async cancel(@Payload() data: { orderId: string; userId: string; reason: string }) {
    return this.ordersService.cancel(data);
  }

  @MessagePattern(MSG_PATTERNS.ORDER_UPDATE_STATUS)
  async updateStatus(@Payload() data: { orderId: string; userId: string; status: string; role: string }) {
    return this.ordersService.updateStatus(data);
  }
}
