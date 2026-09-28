import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { createConfiguredPaymentProvider } from './payments.module';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { XPayPaymentProvider } from './providers/xpay-payment.provider';

function configFor(values: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
    getOrThrow: vi.fn((key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing ${key}`);
      return value;
    }),
  } as unknown as ConfigService;
}

describe('PaymentsModule provider selection', () => {
  it.each(['manual', 'bypass', 'disabled', 'demo'])(
    '%s mode does not require gateway secrets',
    async (mode) => {
      const config = configFor({
        'payment.provider': mode,
        FRONTEND_URL: 'https://sanad.example',
      });
      const provider = createConfiguredPaymentProvider(config);

      await expect(
        provider.verifyWebhook({}, '', Buffer.alloc(0)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(config.getOrThrow).not.toHaveBeenCalled();
    },
  );

  it('constructs only the selected mock provider', () => {
    const provider = createConfiguredPaymentProvider(
      configFor({
        'payment.provider': 'mock',
        PAYMENT_WEBHOOK_SECRET: 'test-webhook-secret',
        FRONTEND_URL: 'https://sanad.example',
      }),
    );

    expect(provider).toBeInstanceOf(MockPaymentProvider);
  });

  it('constructs only the selected XPay provider', () => {
    const provider = createConfiguredPaymentProvider(
      configFor({
        'payment.provider': 'xpay',
        XPAY_SECRET_KEY: 'xpay-secret',
        XPAY_WEBHOOK_SECRET: 'xpay-webhook-secret',
        FRONTEND_URL: 'https://sanad.example',
      }),
    );

    expect(provider).toBeInstanceOf(XPayPaymentProvider);
  });
});
