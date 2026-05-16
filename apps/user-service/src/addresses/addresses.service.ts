import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from '../entities/user-address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(UserAddress) private readonly addressRepo: Repository<UserAddress>,
  ) {}

  async list(userId: string) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: Partial<UserAddress>) {
    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.addressRepo.update({ userId, isDefault: true }, { isDefault: false });
    }

    // If it's the first address, make it default
    const count = await this.addressRepo.count({ where: { userId } });
    if (count === 0) dto.isDefault = true;

    const address = this.addressRepo.create({ userId, ...dto });
    return this.addressRepo.save(address);
  }

  async update(userId: string, addressId: string, dto: Partial<UserAddress>) {
    const address = await this.addressRepo.findOne({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Địa chỉ không tồn tại');
    if (address.userId !== userId) throw new ForbiddenException();

    if (dto.isDefault) {
      await this.addressRepo.update({ userId, isDefault: true }, { isDefault: false });
    }

    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async delete(userId: string, addressId: string) {
    const address = await this.addressRepo.findOne({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Địa chỉ không tồn tại');
    if (address.userId !== userId) throw new ForbiddenException();

    await this.addressRepo.remove(address);
    return { message: 'Đã xoá địa chỉ' };
  }
}
