import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '@app/common';

const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['CUSTOMER', 'RESTAURANT_OWNER', 'DRIVER'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'phone', 'email', 'avatarUrl', 'role', 'status', 'createdAt'],
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async updateProfile(userId: string, data: Partial<Pick<User, 'fullName' | 'email' | 'phone' | 'role' | 'avatarUrl'>>) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // ── Validate fullName ──
    if (data.fullName !== undefined) {
      const name = data.fullName.trim();
      if (name.length < 2) throw new BadRequestException('Họ tên phải có ít nhất 2 ký tự');
      if (name.length > 100) throw new BadRequestException('Họ tên không được quá 100 ký tự');
      data.fullName = name;
    }

    // ── Validate phone ──
    if (data.phone !== undefined) {
      const phone = data.phone.replace(/\s|-/g, ''); // Remove spaces/dashes
      if (!PHONE_REGEX.test(phone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ (VD: 0901234567)');
      }
      data.phone = phone;

      // Check uniqueness
      if (phone !== user.phone) {
        const phoneExists = await this.userRepo.findOne({ where: { phone, id: Not(userId) } });
        if (phoneExists) throw new ConflictException('Số điện thoại đã được sử dụng bởi tài khoản khác');
      }
    }

    // ── Validate email ──
    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        throw new BadRequestException('Email không hợp lệ');
      }
      data.email = email;

      // Check uniqueness
      if (email !== user.email) {
        const emailExists = await this.userRepo.findOne({ where: { email, id: Not(userId) } });
        if (emailExists) throw new ConflictException('Email đã được sử dụng bởi tài khoản khác');
      }
    }

    // ── Validate role ──
    if (data.role !== undefined) {
      if (!VALID_ROLES.includes(data.role as string)) {
        throw new BadRequestException(`Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`);
      }
    }

    // Apply changes
    if (data.fullName) user.fullName = data.fullName;
    if (data.email) user.email = data.email;
    if (data.phone) user.phone = data.phone;
    if (data.role) user.role = data.role;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;

    // Mark profile as ACTIVE if it was INCOMPLETE (social login completion)
    if (user.status === 'INCOMPLETE' && user.phone && user.role) {
      user.status = 'ACTIVE';
    }

    await this.userRepo.save(user);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
    };
  }
}
