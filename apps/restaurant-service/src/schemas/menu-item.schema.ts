import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ── Menu Item Option ──
@Schema({ _id: false })
export class MenuItemOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  extraPrice: number;
}

// ── Menu Item Option Group ──
@Schema({ _id: false })
export class MenuItemOptionGroup {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: 1 })
  maxSelect: number;

  @Prop({ type: [MenuItemOption], default: [] })
  options: MenuItemOption[];
}

// ── Menu Item ──
export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ collection: 'menu_items', timestamps: true })
export class MenuItem {
  @Prop({ required: true, index: true })
  restaurantId: string;

  @Prop({ required: true })
  categoryId: string; // Reference to MenuCategory

  @Prop({ required: true })
  categoryName: string; // Denormalized for query performance

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ type: String, default: null })
  image: string | null;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 0 })
  totalSold: number;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ type: [MenuItemOptionGroup], default: [] })
  optionGroups: MenuItemOptionGroup[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ restaurantId: 1, categoryId: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
