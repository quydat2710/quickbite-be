import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OtpRequest } from '../entities/otp-request.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, RefreshToken, OtpRequest]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SocialAuthService],
  exports: [AuthService],
})
export class AuthModule {}
