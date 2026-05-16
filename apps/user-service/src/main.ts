import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.USER_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.USER_SERVICE_PORT || '3001', 10),
      },
    },
  );

  await app.listen();
  Logger.log(
    `👤 User Service (TCP) listening on port ${process.env.USER_SERVICE_PORT || 3001}`,
    'UserService',
  );
}
bootstrap();
