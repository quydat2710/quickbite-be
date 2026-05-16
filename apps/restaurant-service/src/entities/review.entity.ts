import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurantId: string;

  @Column()
  customerId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId: string; // Phase 1: trust client. Phase 2+: validate via reviewable_orders

  @Column({ length: 100 })
  customerName: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'text', nullable: true })
  reply: string; // Restaurant owner reply

  @Column({ type: 'timestamp', nullable: true })
  repliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
