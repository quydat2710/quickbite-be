import {
  Controller,
  Post,
  Body,
  Inject,
  Req,
  Get,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { SERVICES, MSG_PATTERNS, ApiResponse } from '@app/common';
import { Public } from '../guards/auth.guard';
import { AuthGuard } from '../guards/auth.guard';
import { ConfigService } from '@nestjs/config';

// ── DTOs ──
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn Đạt' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'dat@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SERVICES.USER) private readonly userClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register/customer')
  @ApiOperation({ summary: 'Đăng ký tài khoản customer' })
  async register(@Body() dto: RegisterDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_REGISTER, {
        ...dto,
        role: 'CUSTOMER',
      }),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  async login(@Body() dto: LoginDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_LOGIN, dto),
    );
    return ApiResponse.success(result);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_LOGOUT, {
        userId: req.user!.userId,
        accessToken: token,
      }),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_REFRESH, dto),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi mã OTP' })
  async sendOtp(@Body() dto: SendOtpDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_SEND_OTP, dto),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.AUTH_VERIFY_OTP, dto),
    );
    return ApiResponse.success(result);
  }

  // ── Google OAuth ──
  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirect đến Google OAuth' })
  googleLogin(@Res() res: Response) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl!)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/login?error=no_code`);
    }

    try {
      const result = await firstValueFrom(
        this.userClient.send(MSG_PATTERNS.AUTH_SOCIAL_LOGIN, {
          provider: 'google',
          code,
          redirectUri: this.configService.get('GOOGLE_CALLBACK_URL'),
        }),
      );
      // Redirect to frontend with tokens
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (error) {
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(`${frontendUrl}/login?error=social_login_failed`);
    }
  }

  // ── Facebook OAuth ──
  @Public()
  @Get('facebook')
  @ApiOperation({ summary: 'Redirect đến Facebook OAuth' })
  facebookLogin(@Res() res: Response) {
    const appId = this.configService.get('FACEBOOK_APP_ID');
    const callbackUrl = this.configService.get('FACEBOOK_CALLBACK_URL');
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl!)}&scope=email,public_profile`;
    res.redirect(url);
  }

  @Public()
  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/login?error=no_code`);
    }

    try {
      const result = await firstValueFrom(
        this.userClient.send(MSG_PATTERNS.AUTH_SOCIAL_LOGIN, {
          provider: 'facebook',
          code,
          redirectUri: this.configService.get('FACEBOOK_CALLBACK_URL'),
        }),
      );
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (error) {
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(`${frontendUrl}/login?error=social_login_failed`);
    }
  }
}
