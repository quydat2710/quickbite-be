import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  menuItemId: string; // MongoDB _id from menu-items

  @Column({ length: 200 })
  name: string; // denormalized

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  unitPrice: number;

  @Column({ type: 'smallint', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  totalPrice: number; // unitPrice * quantity + options

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  // Selected options stored as JSON (denormalized from menu)
  @Column({ type: 'jsonb', default: '[]' })
  selectedOptions: {
    groupName: string;
    optionName: string;
    extraPrice: number;
  }[];

  @Column({ type: 'text', nullable: true })
  specialNote: string;
}
