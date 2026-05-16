import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmetModule from 'helmet';
import * as compression from 'compression';

const helmetMiddleware = (helmetModule as any).default || helmetModule;
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);
  const logger = new Logger('APIGateway');

  // ── Security ──
  app.use(helmetMiddleware());
  app.use(compression());

  // ── CORS ──
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3100'),
    credentials: true,
  });

  // ── Global Prefix ──
  app.setGlobalPrefix('v1');

  // ── Global Pipes ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters ──
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger ──
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QuickBite API')
    .setDescription('Food Ordering & Delivery Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & Registration')
    .addTag('Users', 'User Profile & Settings')
    .addTag('Restaurants', 'Restaurant CRUD & Search')
    .addTag('Menu', 'Menu Management')
    .addTag('Reviews', 'Review & Rating')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`🚀 API Gateway running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
