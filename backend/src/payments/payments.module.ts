import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  AdminPaymentsController,
} from './payments.controller';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { XPayPaymentProvider } from './providers/xpay-payment.provider';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_PROVIDER_TOKEN,
  PaymentProvider,
} from './interfaces/payment-provider.interface';

@Module({
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    XPayPaymentProvider,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      inject: [ConfigService, MockPaymentProvider, XPayPaymentProvider],
      useFactory: (
        config: ConfigService,
        mock: MockPaymentProvider,
        xpay: XPayPaymentProvider,
      ): PaymentProvider =>
        (config.get<string>('payment.provider') ||
          config.get<string>('PAYMENT_PROVIDER')) === 'xpay'
          ? xpay
          : mock,
    },
  ],
  exports: [PaymentsService, MockPaymentProvider, XPayPaymentProvider],
})
export class PaymentsModule {}
