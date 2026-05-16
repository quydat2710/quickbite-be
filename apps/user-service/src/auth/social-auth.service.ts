import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { UserRole, ISocialProfile } from '@app/common';

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async handleSocialLogin(
    provider: 'google' | 'facebook',
    code: string,
    redirectUri: string,
  ) {
    // 1. Exchange code for access token + profile
    const profile = provider === 'google'
      ? await this.getGoogleProfile(code, redirectUri)
      : await this.getFacebookProfile(code, redirectUri);

    // 2. Find or create user
    const user = await this.findOrCreateUser(profile);

    // 3. Generate token pair
    return this.authService.generateTokenPairForUser(user);
  }

  private async getGoogleProfile(code: string, redirectUri: string): Promise<ISocialProfile> {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenData.access_token) {
      this.logger.error('Google token exchange failed', tokenData);
      throw new BadRequestException('Đăng nhập Google thất bại');
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json() as any;

    return {
      provider: 'google',
      providerId: userData.id,
      email: userData.email,
      fullName: userData.name,
      avatarUrl: userData.picture,
    };
  }

  private async getFacebookProfile(code: string, redirectUri: string): Promise<ISocialProfile> {
    const appId = this.configService.get('FACEBOOK_APP_ID');
    const appSecret = this.configService.get('FACEBOOK_APP_SECRET');

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json() as any;

    if (!tokenData.access_token) {
      this.logger.error('Facebook token exchange failed', tokenData);
      throw new BadRequestException('Đăng nhập Facebook thất bại');
    }

    // Get user info
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`,
    );
    const userData = await userResponse.json() as any;

    return {
      provider: 'facebook',
      providerId: userData.id,
      email: userData.email || `fb_${userData.id}@quickbite.local`,
      fullName: userData.name,
      avatarUrl: userData.picture?.data?.url,
    };
  }

  private async findOrCreateUser(profile: ISocialProfile): Promise<User> {
    const providerIdField = profile.provider === 'google' ? 'googleId' : 'facebookId';

    // 1. Find by provider ID
    let user = await this.userRepo.findOne({
      where: { [providerIdField]: profile.providerId },
    });

    if (user) {
      this.logger.log(`Social login: existing user ${user.id} via ${profile.provider}`);
      return user;
    }

    // 2. Find by email (link accounts)
    if (profile.email) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        // Link social account to existing user
        user[providerIdField] = profile.providerId;
        if (profile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = profile.avatarUrl;
        }
        await this.userRepo.save(user);
        this.logger.log(`Social login: linked ${profile.provider} to existing user ${user.id}`);
        return user;
      }
    }

    // 3. Create new user
    user = this.userRepo.create({
      fullName: profile.fullName,
      email: profile.email,
      avatarUrl: profile.avatarUrl || undefined,
      role: UserRole.CUSTOMER,
      [providerIdField]: profile.providerId,
    });

    await this.userRepo.save(user);
    this.logger.log(`Social login: created new user ${user.id} via ${profile.provider}`);
    return user;
  }
}
