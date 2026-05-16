import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { IRequestUser, ApiResponse } from '@app/common';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async create(data: {
    user: IRequestUser;
    restaurantId: string;
    orderId?: string;
    customerName: string;
    rating: number;
    comment?: string;
  }) {
    // Phase 1: trust client. Phase 2+: validate orderId via reviewable_orders

    const review = this.reviewRepo.create({
      restaurantId: data.restaurantId,
      customerId: data.user.userId,
      orderId: data.orderId || undefined,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment || undefined,
    });

    await this.reviewRepo.save(review);

    // Update restaurant rating
    await this.updateRestaurantRating(data.restaurantId);

    return review;
  }

  async list(restaurantId: string, page: number, limit: number) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return ApiResponse.paginated(reviews, total, page, limit);
  }

  async reply(data: { user: IRequestUser; reviewId: string; reply: string }) {
    const review = await this.reviewRepo.findOne({ where: { id: data.reviewId } });
    if (!review) throw new NotFoundException('Đánh giá không tồn tại');

    // Check restaurant ownership
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: review.restaurantId },
    });
    if (!restaurant || restaurant.ownerId !== data.user.userId) {
      throw new ForbiddenException('Bạn không có quyền phản hồi');
    }

    review.reply = data.reply;
    review.repliedAt = new Date();
    return this.reviewRepo.save(review);
  }

  private async updateRestaurantRating(restaurantId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'totalReviews')
      .where('r.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    await this.restaurantRepo.update(restaurantId, {
      rating: parseFloat(result.avgRating) || 0,
      totalReviews: parseInt(result.totalReviews, 10),
    });
  }
}
