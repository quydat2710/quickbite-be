import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @MessagePattern(MSG_PATTERNS.REVIEW_CREATE)
  async create(@Payload() data: any) {
    return this.reviewsService.create(data);
  }

  @MessagePattern(MSG_PATTERNS.REVIEW_LIST)
  async list(@Payload() data: { restaurantId: string; page: number; limit: number }) {
    return this.reviewsService.list(data.restaurantId, data.page, data.limit);
  }

  @MessagePattern(MSG_PATTERNS.REVIEW_REPLY)
  async reply(@Payload() data: any) {
    return this.reviewsService.reply(data);
  }
}
