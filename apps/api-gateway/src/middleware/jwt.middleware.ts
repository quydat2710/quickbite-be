import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { ITokenPayload, IRequestUser, REDIS_KEYS } from '@app/common';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IRequestUser;
    }
  }
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name);
  private readonly redis: Redis;
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = configService.get<string>('JWT_SECRET')!;
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token — let the route guard decide if auth is required
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      // 1. Verify JWT
      const payload = jwt.verify(token, this.jwtSecret) as ITokenPayload;

      // 2. Check if token is blacklisted (logout)
      const isBlacklisted = await this.redis.get(
        REDIS_KEYS.TOKEN_BLACKLIST(payload.jti),
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token đã bị thu hồi');
      }

      // 3. Attach user info to request (forwarded to services via TCP payload)
      req.user = {
        userId: payload.sub,
        role: payload.role,
        restaurantId: payload.restaurantId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      // Invalid/expired token — treat as unauthenticated
      this.logger.debug(`Invalid JWT: ${error instanceof Error ? error.message : 'unknown'}`);
    }

    next();
  }
}
