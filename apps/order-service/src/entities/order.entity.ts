import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus, PaymentMethod } from '@app/common';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Core references ──
  @Column()
  customerId: string;

  @Column()
  restaurantId: string;

  @Column({ length: 200 })
  restaurantName: string; // denormalized

  @Column({ length: 100 })
  customerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string;

  // ── Delivery ──
  @Column({ type: 'text' })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLng: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deliveryDistance: number; // km

  // ── Pricing ──
  @Column({ type: 'decimal', precision: 12, scale: 0 })
  subtotal: number; // sum of item prices

  @Column({ type: 'decimal', precision: 12, scale: 0, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  total: number; // subtotal + deliveryFee - discount

  // ── Status & Payment ──
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  paymentId: string; // ref to payment-service

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', nullable: true })
  cancelReason: string;

  @Column({ type: 'varchar', nullable: true })
  driverId: string; // assigned delivery driver

  // ── Timestamps ──
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  preparedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // ── Relations ──
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
