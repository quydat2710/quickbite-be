import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MSG_PATTERNS.USER_GET_PROFILE)
  async getProfile(@Payload() data: { userId: string }) {
    return this.usersService.getProfile(data.userId);
  }

  @MessagePattern(MSG_PATTERNS.USER_UPDATE_PROFILE)
  async updateProfile(
    @Payload() data: { userId: string; fullName?: string; email?: string; phone?: string },
  ) {
    return this.usersService.updateProfile(data.userId, data);
  }
}
