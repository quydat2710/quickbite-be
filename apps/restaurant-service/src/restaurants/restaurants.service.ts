import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { RestaurantCategory } from '../entities/restaurant-category.entity';
import { IRequestUser, ApiResponse } from '@app/common';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(RestaurantCategory) private readonly categoryRepo: Repository<RestaurantCategory>,
  ) {}

  // ── Search with Haversine distance ──
  async search(query: {
    keyword?: string;
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let qb: SelectQueryBuilder<Restaurant> = this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.categories', 'cat')
      .where('r.status = :status', { status: 'APPROVED' })
      .andWhere('r.isOnline = :online', { online: true });

    // Keyword search
    if (query.keyword) {
      qb = qb.andWhere('LOWER(r.name) LIKE LOWER(:keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    // Category filter
    if (query.category) {
      qb = qb.andWhere('cat.name = :catName', { catName: query.category });
    }

    // Distance filter with Haversine formula
    if (query.lat && query.lng) {
      const radius = query.radius || 5; // km

      qb = qb.addSelect(
        `(6371 * acos(
          cos(radians(:lat)) * cos(radians(r.latitude))
          * cos(radians(r.longitude) - radians(:lng))
          + sin(radians(:lat)) * sin(radians(r.latitude))
        ))`,
        'distance',
      );
      qb = qb.setParameter('lat', query.lat);
      qb = qb.setParameter('lng', query.lng);
      qb = qb.having('distance <= :radius', { radius });
      qb = qb.orderBy('distance', 'ASC');
    } else {
      qb = qb.orderBy('r.rating', 'DESC');
    }

    // Get total count (without pagination)
    const total = await qb.getCount();

    // Apply pagination
    const restaurants = await qb.skip(offset).take(limit).getMany();

    return ApiResponse.paginated(restaurants, total, page, limit);
  }

  // ── Get by ID ──
  async getById(id: string) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!restaurant) throw new NotFoundException('Nhà hàng không tồn tại');
    return restaurant;
  }

  // ── Create ──
  async create(user: IRequestUser, data: Partial<Restaurant>) {
    const restaurant = this.restaurantRepo.create({
      ...data,
      ownerId: user.userId,
      status: 'PENDING', // Requires admin approval
    });
    await this.restaurantRepo.save(restaurant);
    this.logger.log(`Restaurant created: ${restaurant.name} by user ${user.userId}`);
    return restaurant;
  }

  // ── Update ──
  async update(user: IRequestUser, restaurantId: string, data: Partial<Restaurant>) {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Nhà hàng không tồn tại');

    // Only owner or admin can update
    if (restaurant.ownerId !== user.userId && user.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa nhà hàng này');
    }

    // Don't allow changing ownership or status via this endpoint
    delete (data as any).ownerId;
    delete (data as any).status;
    delete (data as any).user;
    delete (data as any).restaurantId;

    Object.assign(restaurant, data);
    return this.restaurantRepo.save(restaurant);
  }

  // ── Toggle online ──
  async toggleOnline(user: IRequestUser, restaurantId: string) {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Nhà hàng không tồn tại');

    if (restaurant.ownerId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền');
    }

    restaurant.isOnline = !restaurant.isOnline;
    await this.restaurantRepo.save(restaurant);

    return { isOnline: restaurant.isOnline };
  }
}
