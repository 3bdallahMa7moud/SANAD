import { BadRequestException } from '@nestjs/common';
import {
  CreatePaymentParams,
  PaymentIntentResult,
  PaymentProvider,
  WebhookEventPayload,
} from '../interfaces/payment-provider.interface';

export class DisabledPaymentProvider implements PaymentProvider {
  constructor(private readonly mode: string) {}

  async createPaymentIntent(
    _params: CreatePaymentParams,
  ): Promise<PaymentIntentResult> {
    throw this.disabledError();
  }

  async verifyWebhook(
    _payload: unknown,
    _signature: string,
    _rawBody: Buffer,
  ): Promise<WebhookEventPayload> {
    throw this.disabledError();
  }

  private disabledError(): BadRequestException {
    return new BadRequestException({
      message: `Online payment callbacks are disabled in ${this.mode} mode`,
      code: 'PAYMENT_PROVIDER_DISABLED',
    });
  }
}
