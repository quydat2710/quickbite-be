import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_PATTERNS } from '@app/common';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern(MSG_PATTERNS.PAYMENT_CREATE)
  async create(@Payload() data: any) {
    return this.paymentsService.createPayment(data);
  }

  @MessagePattern(MSG_PATTERNS.PAYMENT_GET)
  async getById(@Payload() data: { paymentId: string }) {
    return this.paymentsService.getById(data.paymentId);
  }

  @MessagePattern(MSG_PATTERNS.PAYMENT_CALLBACK)
  async handleCallback(@Payload() data: any) {
    return this.paymentsService.handleProviderCallback(data);
  }

  @MessagePattern(MSG_PATTERNS.PAYMENT_LIST_BY_ORDER)
  async listByOrder(@Payload() data: { orderId: string }) {
    return this.paymentsService.listByOrder(data.orderId);
  }
}
