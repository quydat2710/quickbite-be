import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { CartService } from './cart.service';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern(MSG_PATTERNS.CART_GET)
  async getCart(@Payload() data: { userId: string }) {
    return this.cartService.getCart(data.userId);
  }

  @MessagePattern(MSG_PATTERNS.CART_ADD_ITEM)
  async addItem(@Payload() data: {
    userId: string;
    restaurantId: string;
    restaurantName: string;
    item: any;
  }) {
    return this.cartService.addItem(data);
  }

  @MessagePattern(MSG_PATTERNS.CART_UPDATE_ITEM)
  async updateItem(@Payload() data: {
    userId: string;
    itemIndex: number;
    quantity: number;
  }) {
    return this.cartService.updateItemQuantity(data.userId, data.itemIndex, data.quantity);
  }

  @MessagePattern(MSG_PATTERNS.CART_REMOVE_ITEM)
  async removeItem(@Payload() data: { userId: string; itemIndex: number }) {
    return this.cartService.removeItem(data.userId, data.itemIndex);
  }

  @MessagePattern(MSG_PATTERNS.CART_CLEAR)
  async clearCart(@Payload() data: { userId: string }) {
    return this.cartService.clearCart(data.userId);
  }
}
