import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtMiddleware } from './jwt.middleware';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class JwtMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply JWT middleware to all routes — it's non-blocking,
    // just attaches user if token is valid
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
