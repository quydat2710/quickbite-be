import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { RestaurantsService } from './restaurants.service';

@Controller()
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @MessagePattern(MSG_PATTERNS.RESTAURANT_SEARCH)
  async search(@Payload() data: {
    keyword?: string;
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) {
    return this.restaurantsService.search(data);
  }

  @MessagePattern(MSG_PATTERNS.RESTAURANT_GET_BY_ID)
  async getById(@Payload() data: { id: string }) {
    return this.restaurantsService.getById(data.id);
  }

  @MessagePattern(MSG_PATTERNS.RESTAURANT_CREATE)
  async create(@Payload() data: any) {
    return this.restaurantsService.create(data.user, data);
  }

  @MessagePattern(MSG_PATTERNS.RESTAURANT_UPDATE)
  async update(@Payload() data: any) {
    return this.restaurantsService.update(data.user, data.restaurantId, data);
  }

  @MessagePattern(MSG_PATTERNS.RESTAURANT_TOGGLE_ONLINE)
  async toggleOnline(@Payload() data: { user: any; restaurantId: string }) {
    return this.restaurantsService.toggleOnline(data.user, data.restaurantId);
  }
}
