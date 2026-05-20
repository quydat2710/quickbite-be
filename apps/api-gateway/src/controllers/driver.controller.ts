import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Inject,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SERVICES, MSG_PATTERNS, ApiResponse, UserRole } from '@app/common';
import { Roles } from '../guards/roles.guard';

@ApiTags('Driver')
@ApiBearerAuth()
@Controller('driver')
export class DriverController {
  constructor(
    @Inject(SERVICES.ORDER) private readonly orderClient: ClientProxy,
  ) {}

  @Get('available-orders')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Đơn hàng sẵn sàng giao' })
  async availableOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_AVAILABLE_ORDERS, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }),
    );
    return result;
  }

  @Get('my-deliveries')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Đơn đang giao' })
  async myDeliveries(@Req() req: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_MY_DELIVERIES, {
        driverId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Post('orders/:id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Nhận đơn' })
  async acceptOrder(@Req() req: any, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_ACCEPT_ORDER, {
        orderId: id,
        driverId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Post('orders/:id/pickup')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Đã lấy hàng' })
  async pickupOrder(@Req() req: any, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_PICKUP_ORDER, {
        orderId: id,
        driverId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Post('orders/:id/deliver')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Đã giao hàng' })
  async deliverOrder(@Req() req: any, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_DELIVER_ORDER, {
        orderId: id,
        driverId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Get('history')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Lịch sử giao hàng' })
  async history(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_HISTORY, {
        driverId: req.user.userId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }),
    );
    return result;
  }

  @Get('earnings')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Thu nhập' })
  async earnings(@Req() req: any) {
    const result = await firstValueFrom(
      this.orderClient.send(MSG_PATTERNS.DRIVER_EARNINGS, {
        driverId: req.user.userId,
      }),
    );
    return ApiResponse.success(result);
  }
}
