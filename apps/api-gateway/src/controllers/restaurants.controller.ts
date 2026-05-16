import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { SERVICES, MSG_PATTERNS, ApiResponse, UserRole } from '@app/common';
import { Public } from '../guards/auth.guard';
import { Roles } from '../guards/roles.guard';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ── DTOs ──
class SearchRestaurantsDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  keyword?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  lat?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ default: 5 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50)
  radius?: number;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number)
  limit?: number;
}

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(
    @Inject(SERVICES.RESTAURANT) private readonly restaurantClient: ClientProxy,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm nhà hàng' })
  async search(@Query() query: SearchRestaurantsDto) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.RESTAURANT_SEARCH, query),
    );
    return result; // Already formatted by service
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhà hàng' })
  async getById(@Param('id') id: string) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.RESTAURANT_GET_BY_ID, { id }),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Get(':id/menu')
  @ApiOperation({ summary: 'Menu nhà hàng' })
  async getMenu(@Param('id') id: string) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.MENU_GET, { restaurantId: id }),
    );
    return ApiResponse.success(result);
  }

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Đánh giá nhà hàng' })
  async getReviews(@Param('id') id: string, @Query() query: { page?: number; limit?: number }) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.REVIEW_LIST, {
        restaurantId: id,
        page: query.page || 1,
        limit: query.limit || 20,
      }),
    );
    return result;
  }

  // ── Owner endpoints ──
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo nhà hàng (owner)' })
  async create(@Req() req: Request, @Body() body: any) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.RESTAURANT_CREATE, {
        user: req.user,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật nhà hàng (owner)' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.RESTAURANT_UPDATE, {
        user: req.user,
        restaurantId: id,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }

  @Patch(':id/toggle-online')
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Bật/tắt online (owner)' })
  async toggleOnline(@Req() req: Request, @Param('id') id: string) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.RESTAURANT_TOGGLE_ONLINE, {
        user: req.user,
        restaurantId: id,
      }),
    );
    return ApiResponse.success(result);
  }

  // ── Menu management (owner) ──
  @Post(':id/items')
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Thêm món (owner)' })
  async createItem(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.MENU_ITEM_CREATE, {
        user: req.user,
        restaurantId: id,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }

  @Patch(':id/items/:itemId')
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Cập nhật món (owner)' })
  async updateItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.MENU_ITEM_UPDATE, {
        user: req.user,
        restaurantId: id,
        itemId,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }

  @Delete(':id/items/:itemId')
  @ApiBearerAuth()
  @Roles(UserRole.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Xoá món (owner)' })
  async deleteItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.MENU_ITEM_DELETE, {
        user: req.user,
        restaurantId: id,
        itemId,
      }),
    );
    return ApiResponse.success(result);
  }

  // ── Reviews ──
  @Post(':id/reviews')
  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Đánh giá nhà hàng' })
  async createReview(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const result = await firstValueFrom(
      this.restaurantClient.send(MSG_PATTERNS.REVIEW_CREATE, {
        user: req.user,
        restaurantId: id,
        ...body,
      }),
    );
    return ApiResponse.success(result);
  }
}
