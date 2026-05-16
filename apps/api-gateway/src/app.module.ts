import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SERVICES } from '@app/common';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { RestaurantsController } from './controllers/restaurants.controller';
import { OrdersController } from './controllers/orders.controller';
import { JwtMiddlewareModule } from './middleware/jwt.module';

@Module({
  imports: [
    // ── Config ──
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Rate Limiting ──
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 60 },    // 60 req/min default
      { name: 'auth', ttl: 60000, limit: 10 },      // 10 req/min for auth
    ]),

    // ── TCP Clients to Microservices ──
    ClientsModule.registerAsync([
      {
        name: SERVICES.USER,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('USER_SERVICE_HOST', 'localhost'),
            port: config.get('USER_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.RESTAURANT,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('RESTAURANT_SERVICE_HOST', 'localhost'),
            port: config.get('RESTAURANT_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.ORDER,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('ORDER_SERVICE_HOST', 'localhost'),
            port: config.get('ORDER_SERVICE_PORT', 3003),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.PAYMENT,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('PAYMENT_SERVICE_HOST', 'localhost'),
            port: config.get('PAYMENT_SERVICE_PORT', 3004),
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // ── JWT Middleware ──
    JwtMiddlewareModule,
  ],
  controllers: [AuthController, UsersController, RestaurantsController, OrdersController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
