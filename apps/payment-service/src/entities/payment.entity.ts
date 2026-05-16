import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus, PaymentMethod } from '@app/common';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  customerId: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // ── Provider-specific ──
  @Column({ type: 'varchar', nullable: true })
  transactionId: string; // from MoMo/VNPay

  @Column({ type: 'varchar', nullable: true })
  paymentUrl: string; // redirect URL for online payment

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: Record<string, any>; // raw response from payment provider

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  refundReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
