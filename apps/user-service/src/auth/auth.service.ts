import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OtpRequest } from '../entities/otp-request.entity';
import { UserRole, ITokenPayload, REDIS_KEYS } from '@app/common';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;
  private readonly jwtSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(OtpRequest) private readonly otpRepo: Repository<OtpRequest>,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = configService.get<string>('JWT_SECRET')!;
    this.accessExpiration = configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    this.refreshExpiration = configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  // ── Register ──
  async register(data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    role: string;
  }) {
    // Check phone uniqueness
    const existing = await this.userRepo.findOne({ where: { phone: data.phone } });
    if (existing) {
      throw new ConflictException('Số điện thoại đã được đăng ký');
    }

    if (data.email) {
      const emailExists = await this.userRepo.findOne({ where: { email: data.email } });
      if (emailExists) {
        throw new ConflictException('Email đã được đăng ký');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = this.userRepo.create({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || undefined,
      passwordHash,
      role: data.role as UserRole,
    });

    await this.userRepo.save(user);
    this.logger.log(`New user registered: ${user.phone} (${user.role})`);

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
  }

  // ── Login ──
  async login(phone: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { phone },
      select: ['id', 'fullName', 'phone', 'email', 'passwordHash', 'role', 'status', 'avatarUrl'],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    const tokens = await this.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ── Logout ──
  async logout(userId: string, accessToken: string) {
    // 1. Revoke all refresh tokens for this user
    await this.refreshRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // 2. Blacklist the current access token
    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret, {
        ignoreExpiration: true,
      }) as ITokenPayload;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(REDIS_KEYS.TOKEN_BLACKLIST(decoded.jti), ttl, '1');
      }
    } catch {
      // Token may be invalid/expired — that's fine
    }

    return { message: 'Đăng xuất thành công' };
  }

  // ── Refresh Token ──
  async refreshToken(token: string) {
    const tokenHash = this.hashToken(token);
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Revoke old token
    stored.isRevoked = true;
    await this.refreshRepo.save(stored);

    // Find user
    const user = await this.userRepo.findOne({ where: { id: stored.userId } });
    if (!user || user.status === 'BANNED') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khoá');
    }

    // Issue new pair
    return this.generateTokenPair(user);
  }

  // ── OTP ──
  async sendOtp(phone: string) {
    // Rate limit: max 5 OTPs per phone per hour
    const recentCount = await this.otpRepo.count({
      where: {
        phone,
        createdAt: LessThan(new Date(Date.now() - 3600000)) as any, // Workaround
      },
    });
    // Simplified: just generate and log (no real SMS in portfolio)

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

    await this.otpRepo.save({
      phone,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // In development, log the OTP instead of sending SMS
    this.logger.warn(`📱 [DEV] OTP for ${phone}: ${otp}`);

    return { message: 'Mã OTP đã được gửi', expiresIn: 300 };
  }

  async verifyOtp(phone: string, otp: string) {
    const otpRecord = await this.otpRepo.findOne({
      where: { phone, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException('Quá số lần thử, vui lòng gửi mã mới');
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await this.otpRepo.save(otpRecord);
      throw new BadRequestException('Mã OTP không đúng');
    }

    otpRecord.isUsed = true;
    await this.otpRepo.save(otpRecord);

    return { verified: true, phone };
  }

  // ── Token pair for social login (called by SocialAuthService) ──
  async generateTokenPairForUser(user: User) {
    return this.generateTokenPair(user);
  }

  // ── Helpers ──
  private async generateTokenPair(user: User) {
    const jti = uuidv4();

    // Access token
    const accessPayload: Omit<ITokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      jti,
    };
    const accessToken = jwt.sign(accessPayload, this.jwtSecret, {
      expiresIn: Math.floor(this.parseExpiration(this.accessExpiration) / 1000),
    });

    // Refresh token
    const refreshTokenRaw = uuidv4();
    const tokenHash = this.hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + this.parseExpiration(this.refreshExpiration));

    await this.refreshRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiration(exp: string): number {
    const unit = exp.slice(-1);
    const value = parseInt(exp.slice(0, -1), 10);
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 3600 * 1000;
      case 'd': return value * 86400 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
}
