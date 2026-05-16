import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus, PaymentMethod, SERVICES, MSG_PATTERNS } from '@app/common';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @Inject(SERVICES.ORDER) private readonly orderClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  // ── Create payment ──
  async createPayment(data: {
    orderId: string;
    customerId: string;
    amount: number;
    method: string;
  }) {
    const method = data.method as PaymentMethod;

    const payment = this.paymentRepo.create({
      orderId: data.orderId,
      customerId: data.customerId,
      amount: data.amount,
      method,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepo.save(payment);

    // Generate payment URL based on method
    let paymentUrl: string | undefined;

    switch (method) {
      case PaymentMethod.COD:
        // COD: auto-mark as paid (payment collected on delivery)
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        payment.transactionId = `COD-${payment.id.substring(0, 8)}`;
        await this.paymentRepo.save(payment);

        // Notify Order Service
        await this.notifyOrderPaid(payment);
        break;

      case PaymentMethod.MOMO:
        paymentUrl = this.generateMoMoPaymentUrl(payment);
        payment.paymentUrl = paymentUrl;
        await this.paymentRepo.save(payment);
        break;

      case PaymentMethod.VNPAY:
        paymentUrl = this.generateVNPayPaymentUrl(payment);
        payment.paymentUrl = paymentUrl;
        await this.paymentRepo.save(payment);
        break;

      case PaymentMethod.BANK_TRANSFER:
        // Generate QR code info
        payment.transactionId = `QR-${Date.now()}`;
        await this.paymentRepo.save(payment);
        break;
    }

    this.logger.log(
      `Payment created: ${payment.id} | ${method} | ${data.amount.toLocaleString()}đ | Order: ${data.orderId}`,
    );

    return {
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      paymentUrl: payment.paymentUrl,
      transactionId: payment.transactionId,
    };
  }

  // ── Get payment ──
  async getById(paymentId: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Thanh toán không tồn tại');
    return payment;
  }

  // ── Handle callback from payment provider ──
  async handleProviderCallback(data: {
    provider: string;
    transactionId: string;
    status: string;
    rawData: Record<string, any>;
  }) {
    // Find payment by transactionId
    const payment = await this.paymentRepo.findOne({
      where: { transactionId: data.transactionId },
    });

    if (!payment) {
      this.logger.warn(`Payment callback: transaction ${data.transactionId} not found`);
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(`Payment ${payment.id} already processed: ${payment.status}`);
      return { message: 'Đã xử lý trước đó' };
    }

    // Save raw response
    payment.providerResponse = data.rawData;

    if (data.status === 'success') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      await this.paymentRepo.save(payment);

      // Notify Order Service
      await this.notifyOrderPaid(payment);

      this.logger.log(`Payment SUCCESS: ${payment.id} | Order: ${payment.orderId}`);
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      this.logger.warn(`Payment FAILED: ${payment.id} | Order: ${payment.orderId}`);
    }

    return { paymentId: payment.id, status: payment.status };
  }

  // ── List by order ──
  async listByOrder(orderId: string) {
    return this.paymentRepo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Notify Order Service that payment is completed ──
  private async notifyOrderPaid(payment: Payment) {
    try {
      await firstValueFrom(
        this.orderClient.send(MSG_PATTERNS.ORDER_UPDATE_STATUS, {
          orderId: payment.orderId,
          userId: payment.customerId,
          status: 'CONFIRMED',
          role: 'SYSTEM',
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to notify order ${payment.orderId}: ${error}`);
    }
  }

  // ── MoMo Payment URL (stub) ──
  private generateMoMoPaymentUrl(payment: Payment): string {
    const orderId = `MOMO-${payment.id.substring(0, 8)}`;
    payment.transactionId = orderId;

    // In production, this would call MoMo's API
    // For portfolio: generate a mock redirect URL
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3100');
    return `${frontendUrl}/payment/result?provider=momo&transactionId=${orderId}&amount=${payment.amount}`;
  }

  // ── VNPay Payment URL (stub) ──
  private generateVNPayPaymentUrl(payment: Payment): string {
    const txnRef = `VNPAY-${payment.id.substring(0, 8)}-${Date.now()}`;
    payment.transactionId = txnRef;

    // In production, this would build VNPay's query string with HMAC
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3100');
    return `${frontendUrl}/payment/result?provider=vnpay&transactionId=${txnRef}&amount=${payment.amount}`;
  }
}
