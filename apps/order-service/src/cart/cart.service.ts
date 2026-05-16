import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_KEYS } from '@app/common';

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  selectedOptions: { groupName: string; optionName: string; extraPrice: number }[];
  specialNote?: string;
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  updatedAt: string;
}

const CART_TTL = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  async getCart(userId: string): Promise<Cart | null> {
    const raw = await this.redis.get(REDIS_KEYS.CART(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async addItem(data: {
    userId: string;
    restaurantId: string;
    restaurantName: string;
    item: CartItem;
  }): Promise<Cart> {
    let cart = await this.getCart(data.userId);

    // If cart exists but is from a different restaurant, clear it
    if (cart && cart.restaurantId !== data.restaurantId) {
      this.logger.log(
        `Cart switched restaurant for user ${data.userId}: ${cart.restaurantId} → ${data.restaurantId}`,
      );
      cart = null;
    }

    if (!cart) {
      cart = {
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        items: [],
        subtotal: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    // Check if same item already exists (same menuItemId + same options)
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.menuItemId === data.item.menuItemId &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(data.item.selectedOptions),
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += data.item.quantity;
    } else {
      cart.items.push(data.item);
    }

    return this.saveCart(data.userId, cart);
  }

  async updateItemQuantity(userId: string, itemIndex: number, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (!cart) throw new BadRequestException('Giỏ hàng trống');
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new BadRequestException('Sản phẩm không tồn tại trong giỏ');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    if (cart.items.length === 0) {
      await this.clearCart(userId);
      return null as any;
    }

    return this.saveCart(userId, cart);
  }

  async removeItem(userId: string, itemIndex: number): Promise<Cart> {
    return this.updateItemQuantity(userId, itemIndex, 0);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    await this.redis.del(REDIS_KEYS.CART(userId));
    return { message: 'Đã xoá giỏ hàng' };
  }

  // ── Internal: called by OrdersService after order is created ──
  async consumeCart(userId: string): Promise<Cart | null> {
    const cart = await this.getCart(userId);
    if (cart) {
      await this.redis.del(REDIS_KEYS.CART(userId));
    }
    return cart;
  }

  private async saveCart(userId: string, cart: Cart): Promise<Cart> {
    cart.subtotal = this.calculateSubtotal(cart.items);
    cart.updatedAt = new Date().toISOString();
    await this.redis.setex(REDIS_KEYS.CART(userId), CART_TTL, JSON.stringify(cart));
    return cart;
  }

  private calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      const optionExtra = item.selectedOptions.reduce((s, o) => s + o.extraPrice, 0);
      return sum + (item.unitPrice + optionExtra) * item.quantity;
    }, 0);
  }
}
