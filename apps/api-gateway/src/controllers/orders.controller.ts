import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SERVICES, MSG_PATTERNS, ApiResponse } from '@app/common';

@ApiTags('Cart & Orders')
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(
    @Inject(SERVICES.ORDER) private readonly orderClient: ClientProxy,
    @Inject(SERVICES.PAYMENT) private readonly paymentClient: ClientProxy,
  ) {}

  // ══════════ CART ══════════

  @Get('cart')
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@Req() req: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.CART_GET, { userId: req.user.userId }),
    );
    return ApiResponse.success(result);
  }

  @Post('cart/items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@Req() req: any, @Body() body: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.CART_ADD_ITEM, {
        userId: req.user.userId,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }

  @Put('cart/items/:index')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @Req() req: any,
    @Param('index') index: string,
    @Body() body: { quantity: number },
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.CART_UPDATE_ITEM, {
        userId: req.user.userId,
        itemIndex: parseInt(index, 10),
        quantity: body.quantity,
      }),
    );
    return ApiResponse.success(result);
  }

  @Delete('cart/items/:index')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeCartItem(@Req() req: any, @Param('index') index: string) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.CART_REMOVE_ITEM, {
        userId: req.user.userId,
        itemIndex: parseInt(index, 10),
      }),
    );
    return ApiResponse.success(result);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@Req() req: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.CART_CLEAR, { userId: req.user.userId }),
    );
    return ApiResponse.success(result);
  }

  // ══════════ ORDERS ══════════

  @Post('orders')
  @ApiOperation({ summary: 'Create order from cart' })
  async createOrder(@Req() req: any, @Body() body: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_CREATE, {
        user: req.user,
        ...body,
      }),
    );

    // Auto-create payment
    if (result) {
      const paymentResult = await firstValueFrom(
        this.paymentClient.send(MSG_PATTERNS.PAYMENT_CREATE, {
          orderId: result.id,
          customerId: req.user.userId,
          amount: result.total,
          method: body.paymentMethod || 'COD',
        }),
      );
      return ApiResponse.success({ order: result, payment: paymentResult });
    }

    return ApiResponse.success(result);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List my orders' })
  async listOrders(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_LIST, {
        userId: req.user.userId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
      }),
    );
    return result; // Already ApiResponse.paginated from service
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail' })
  async getOrder(@Req() req: any, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_GET, {
        orderId: id,
        userId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_CANCEL, {
        orderId: id,
        userId: req.user.userId,
        reason: body.reason,
      }),
    );
    return ApiResponse.success(result);
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status (restaurant owner / driver)' })
  async updateOrderStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_UPDATE_STATUS, {
        orderId: id,
        userId: req.user.userId,
        status: body.status,
        role: req.user.role,
      }),
    );
    return ApiResponse.success(result);
  }

  // ── Restaurant order management ──
  @Get('restaurants/:restaurantId/orders')
  @ApiOperation({ summary: 'List orders for a restaurant (owner)' })
  async listRestaurantOrders(
    @Req() req: any,
    @Param('restaurantId') restaurantId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.ORDER_LIST_RESTAURANT, {
        restaurantId,
        userId: req.user.userId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
      }),
    );
    return result;
  }

  // ══════════ PAYMENTS ══════════

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment detail' })
  async getPayment(@Param('id') id: string) {
    const result = await firstValueFrom(
      this.paymentClient.send(MSG_PATTERNS.PAYMENT_GET, { paymentId: id }),
    );
    return ApiResponse.success(result);
  }

  @Post('payments/callback')
  @ApiOperation({ summary: 'Payment provider callback (MoMo/VNPay)' })
  async paymentCallback(@Body() body: any) {
    const result = await firstValueFrom(
      this.paymentClient.send(MSG_PATTERNS.PAYMENT_CALLBACK, body),
    );
    return ApiResponse.success(result);
  }
}
