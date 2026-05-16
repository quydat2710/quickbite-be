import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { AddressesService } from './addresses.service';

@Controller()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @MessagePattern(MSG_PATTERNS.ADDRESS_LIST)
  async list(@Payload() data: { userId: string }) {
    return this.addressesService.list(data.userId);
  }

  @MessagePattern(MSG_PATTERNS.ADDRESS_CREATE)
  async create(@Payload() data: any) {
    const { userId, ...dto } = data;
    return this.addressesService.create(userId, dto);
  }

  @MessagePattern(MSG_PATTERNS.ADDRESS_UPDATE)
  async update(@Payload() data: any) {
    const { userId, addressId, ...dto } = data;
    return this.addressesService.update(userId, addressId, dto);
  }

  @MessagePattern(MSG_PATTERNS.ADDRESS_DELETE)
  async delete(@Payload() data: { userId: string; addressId: string }) {
    return this.addressesService.delete(data.userId, data.addressId);
  }
}
