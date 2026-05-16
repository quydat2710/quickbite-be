import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.ORDER_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.ORDER_SERVICE_PORT || '3003', 10),
      },
    },
  );

  await app.listen();
  Logger.log(
    `📦 Order Service (TCP) listening on port ${process.env.ORDER_SERVICE_PORT || 3003}`,
    'OrderService',
  );
}
bootstrap();
