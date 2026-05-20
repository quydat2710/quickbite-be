import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  @MessagePattern(MSG_PATTERNS.AUTH_REGISTER)
  async register(@Payload() data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    role: string;
  }) {
    return this.authService.register(data);
  }

  @MessagePattern(MSG_PATTERNS.AUTH_LOGIN)
  async login(@Payload() data: { phone: string; password: string }) {
    return this.authService.login(data.phone, data.password);  // phone field acts as identifier (phone or email)
  }

  @MessagePattern(MSG_PATTERNS.AUTH_LOGOUT)
  async logout(@Payload() data: { userId: string; accessToken: string }) {
    return this.authService.logout(data.userId, data.accessToken);
  }

  @MessagePattern(MSG_PATTERNS.AUTH_REFRESH)
  async refresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern(MSG_PATTERNS.AUTH_SEND_OTP)
  async sendOtp(@Payload() data: { phone: string }) {
    return this.authService.sendOtp(data.phone);
  }

  @MessagePattern(MSG_PATTERNS.AUTH_VERIFY_OTP)
  async verifyOtp(@Payload() data: { phone: string; otp: string }) {
    return this.authService.verifyOtp(data.phone, data.otp);
  }

  @MessagePattern(MSG_PATTERNS.AUTH_SOCIAL_LOGIN)
  async socialLogin(@Payload() data: {
    provider: 'google' | 'facebook';
    code: string;
    redirectUri: string;
  }) {
    return this.socialAuthService.handleSocialLogin(
      data.provider,
      data.code,
      data.redirectUri,
    );
  }
}
