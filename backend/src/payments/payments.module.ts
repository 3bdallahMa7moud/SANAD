import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  AdminPaymentsController,
} from './payments.controller';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { XPayPaymentProvider } from './providers/xpay-payment.provider';
import { DisabledPaymentProvider } from './providers/disabled-payment.provider';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_PROVIDER_TOKEN,
  PaymentProvider,
} from './interfaces/payment-provider.interface';

export function createConfiguredPaymentProvider(
  config: ConfigService,
): PaymentProvider {
  const provider =
    config.get<string>('payment.provider') ||
    config.get<string>('PAYMENT_PROVIDER') ||
    'mock';

  if (provider === 'xpay') return new XPayPaymentProvider(config);
  if (provider === 'mock') return new MockPaymentProvider(config);
  return new DisabledPaymentProvider(provider);
}

@Module({
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: createConfiguredPaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
