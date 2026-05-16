import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { MenuService } from './menu.service';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @MessagePattern(MSG_PATTERNS.MENU_GET)
  async getMenu(@Payload() data: { restaurantId: string }) {
    return this.menuService.getMenu(data.restaurantId);
  }

  @MessagePattern(MSG_PATTERNS.MENU_CATEGORY_CREATE)
  async createCategory(@Payload() data: any) {
    return this.menuService.createCategory(data);
  }

  @MessagePattern(MSG_PATTERNS.MENU_ITEM_CREATE)
  async createItem(@Payload() data: any) {
    return this.menuService.createItem(data);
  }

  @MessagePattern(MSG_PATTERNS.MENU_ITEM_UPDATE)
  async updateItem(@Payload() data: any) {
    return this.menuService.updateItem(data);
  }

  @MessagePattern(MSG_PATTERNS.MENU_ITEM_DELETE)
  async deleteItem(@Payload() data: any) {
    return this.menuService.deleteItem(data);
  }
}
