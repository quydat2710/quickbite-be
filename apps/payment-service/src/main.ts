import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3004', 10),
      },
    },
  );

  await app.listen();
  Logger.log(
    `💳 Payment Service (TCP) listening on port ${process.env.PAYMENT_SERVICE_PORT || 3004}`,
    'PaymentService',
  );
}
bootstrap();
