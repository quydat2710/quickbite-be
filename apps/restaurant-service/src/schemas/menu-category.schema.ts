import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MenuCategoryDocument = HydratedDocument<MenuCategory>;

@Schema({ collection: 'menu_categories', timestamps: true })
export class MenuCategory {
  @Prop({ required: true, index: true })
  restaurantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);
