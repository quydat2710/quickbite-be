import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { RestaurantServiceModule } from './restaurant-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RestaurantServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.RESTAURANT_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.RESTAURANT_SERVICE_PORT || '3002', 10),
      },
    },
  );

  await app.listen();
  Logger.log(
    `🍜 Restaurant Service (TCP) listening on port ${process.env.RESTAURANT_SERVICE_PORT || 3002}`,
    'RestaurantService',
  );
}
bootstrap();
