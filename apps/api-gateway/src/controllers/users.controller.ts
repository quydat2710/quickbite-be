import {
  Controller,
  Get,
  Patch,
  Body,
  Inject,
  Req,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { SERVICES, MSG_PATTERNS, ApiResponse } from '@app/common';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── DTOs ──
class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['CUSTOMER', 'RESTAURANT_OWNER', 'DRIVER'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện (từ Cloudinary)' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

class CreateAddressDto {
  @ApiProperty({ example: 'Nhà' })
  @IsString()
  label: string;

  @ApiProperty({ example: '227 Nguyễn Văn Cừ, Q.5, TP.HCM' })
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 106.682514 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject(SERVICES.USER) private readonly userClient: ClientProxy,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile' })
  async getProfile(@Req() req: Request) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.USER_GET_PROFILE, {
        userId: req.user!.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật profile' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.USER_UPDATE_PROFILE, {
        userId: req.user!.userId,
        ...dto,
      }),
    );
    return ApiResponse.success(result);
  }

  // ── Addresses ──
  @Get('me/addresses')
  @ApiOperation({ summary: 'Danh sách địa chỉ' })
  async getAddresses(@Req() req: Request) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.ADDRESS_LIST, {
        userId: req.user!.userId,
      }),
    );
    return ApiResponse.success(result);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  async createAddress(@Req() req: Request, @Body() dto: CreateAddressDto) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.ADDRESS_CREATE, {
        userId: req.user!.userId,
        ...dto,
      }),
    );
    return ApiResponse.success(result);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  async updateAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateAddressDto,
  ) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.ADDRESS_UPDATE, {
        userId: req.user!.userId,
        addressId: id,
        ...dto,
      }),
    );
    return ApiResponse.success(result);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Xoá địa chỉ' })
  async deleteAddress(@Req() req: Request, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.userClient.send(MSG_PATTERNS.ADDRESS_DELETE, {
        userId: req.user!.userId,
        addressId: id,
      }),
    );
    return ApiResponse.success(result);
  }
}
