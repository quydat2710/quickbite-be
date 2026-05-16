import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { MenuItem, MenuItemDocument } from '../schemas/menu-item.schema';
import { MenuCategory, MenuCategoryDocument } from '../schemas/menu-category.schema';
import { REDIS_KEYS } from '@app/common';

const MENU_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private readonly redis: Redis;

  constructor(
    @InjectModel(MenuItem.name) private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(MenuCategory.name) private readonly menuCategoryModel: Model<MenuCategoryDocument>,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  // ── Get full menu (with Redis cache) ──
  async getMenu(restaurantId: string) {
    const cacheKey = REDIS_KEYS.MENU_CACHE(restaurantId);

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Menu cache HIT: ${restaurantId}`);
      return JSON.parse(cached);
    }

    // Query MongoDB
    const categories = await this.menuCategoryModel
      .find({ restaurantId })
      .sort({ sortOrder: 1 })
      .lean();

    const items = await this.menuItemModel
      .find({ restaurantId })
      .sort({ sortOrder: 1 })
      .lean();

    // Group items by category
    const menu = categories.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.categoryId === cat._id?.toString()),
    }));

    // Cache result
    await this.redis.setex(cacheKey, MENU_CACHE_TTL, JSON.stringify(menu));
    this.logger.debug(`Menu cache SET: ${restaurantId}`);

    return menu;
  }

  // ── Create category ──
  async createCategory(data: { restaurantId: string; name: string; sortOrder?: number }) {
    const category = await this.menuCategoryModel.create(data);
    await this.invalidateMenuCache(data.restaurantId);
    return category;
  }

  // ── Create menu item ──
  async createItem(data: any) {
    const { user, restaurantId, ...itemData } = data;

    // Look up category name
    if (itemData.categoryId) {
      const cat = await this.menuCategoryModel.findById(itemData.categoryId).lean();
      if (cat) itemData.categoryName = cat.name;
    }

    const item = await this.menuItemModel.create({
      restaurantId,
      ...itemData,
    });

    await this.invalidateMenuCache(restaurantId);
    return item;
  }

  // ── Update menu item ──
  async updateItem(data: any) {
    const { user, restaurantId, itemId, ...updateData } = data;

    const item = await this.menuItemModel.findOneAndUpdate(
      { _id: itemId, restaurantId },
      { $set: updateData },
      { new: true },
    );

    if (!item) throw new NotFoundException('Món ăn không tồn tại');

    await this.invalidateMenuCache(restaurantId);
    return item;
  }

  // ── Delete menu item ──
  async deleteItem(data: { user: any; restaurantId: string; itemId: string }) {
    const result = await this.menuItemModel.deleteOne({
      _id: data.itemId,
      restaurantId: data.restaurantId,
    });

    if (result.deletedCount === 0) throw new NotFoundException('Món ăn không tồn tại');

    await this.invalidateMenuCache(data.restaurantId);
    return { message: 'Đã xoá món ăn' };
  }

  // ── Cache invalidation ──
  private async invalidateMenuCache(restaurantId: string) {
    await this.redis.del(REDIS_KEYS.MENU_CACHE(restaurantId));
    this.logger.debug(`Menu cache INVALIDATED: ${restaurantId}`);
  }
}
