import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XPayPaymentProvider } from './xpay-payment.provider';

describe('XPayPaymentProvider', () => {
  const secretKey = 'sk_test_sanadIntegrationKey123';
  const webhookSecret = 'whsec_sanadWebhookSecret123';
  let provider: XPayPaymentProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const values: Record<string, string> = {
      XPAY_SECRET_KEY: secretKey,
      XPAY_WEBHOOK_SECRET: webhookSecret,
      XPAY_API_BASE_URL: 'https://api.xpay.app',
      FRONTEND_URL: 'https://sanad.example',
    };
    const configService = {
      getOrThrow: vi.fn((key: string) => {
        if (!values[key]) throw new Error(`Missing ${key}`);
        return values[key];
      }),
      get: vi.fn((key: string) => values[key]),
    };
    provider = new XPayPaymentProvider(
      configService as unknown as ConfigService,
    );
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an AED hosted checkout and validates the presentment track', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'cs_test_checkout123',
          url: 'https://checkout.xpay.app/c/cs_test_checkout123',
          amountTotal: 9_850_000,
          currency: 'EGP',
          presentmentDetails: {
            amountTotal: 71_910,
            currency: 'AED',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await provider.createPaymentIntent({
      orderId: 7,
      orderNumber: 'SANAD-2026-000007',
      attemptNumber: 1,
      amount: 719.1,
      currency: 'AED',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+971500000000',
      returnUrl: 'https://sanad.example/order-success/SANAD-2026-000007',
    });

    expect(result).toEqual({
      transactionId: 'cs_test_checkout123',
      paymentUrl: 'https://checkout.xpay.app/c/cs_test_checkout123',
      provider: 'xpay',
      amount: 719.1,
      currency: 'AED',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.xpay.app/checkout/sessions');
    expect(options.headers).toMatchObject({
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': expect.stringMatching(/^sanad_[a-f0-9]{64}$/),
    });
    expect(JSON.parse(String(options.body))).toMatchObject({
      uiMode: 'hosted',
      paymentMethodTypes: ['card'],
      lineItems: [
        {
          priceData: { currency: 'AED', unitAmount: 71_910 },
          quantity: 1,
        },
      ],
      metadata: { orderId: '7', orderNumber: 'SANAD-2026-000007' },
    });
  });

  it('never compares an AED order to the EGP processing total', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'cs_test_checkout123',
          url: 'https://checkout.xpay.app/c/cs_test_checkout123',
          amountTotal: 9_850_000,
          currency: 'EGP',
          presentmentDetails: {
            amountTotal: 71_900,
            currency: 'AED',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(
      provider.createPaymentIntent({
        orderId: 7,
        orderNumber: 'SANAD-2026-000007',
        attemptNumber: 1,
        amount: 719.1,
        currency: 'AED',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('uses one stable idempotency key per logical checkout attempt', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            id: 'cs_test_checkout123',
            url: 'https://checkout.xpay.app/c/cs_test_checkout123',
            amountTotal: 9_850_000,
            currency: 'EGP',
            presentmentDetails: { amountTotal: 71_910, currency: 'AED' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    const params = {
      orderId: 7,
      orderNumber: 'SANAD-2026-000007',
      attemptNumber: 1,
      amount: 719.1,
      currency: 'AED',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
    };

    await provider.createPaymentIntent(params);
    await provider.createPaymentIntent(params);
    await provider.createPaymentIntent({ ...params, attemptNumber: 2 });

    const keys = fetchMock.mock.calls.map(
      ([, options]) =>
        (options as RequestInit).headers as Record<string, string>,
    );
    expect(keys[0]['Idempotency-Key']).toBe(keys[1]['Idempotency-Key']);
    expect(keys[2]['Idempotency-Key']).not.toBe(keys[0]['Idempotency-Key']);
  });

  it('verifies XPay timestamped signatures and returns AED presentment data', async () => {
    const event = {
      id: 'evt_checkout_paid_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_checkout123',
          paymentStatus: 'paid',
          amountTotal: 9_850_000,
          currency: 'EGP',
          presentmentDetails: {
            amountTotal: 71_910,
            currency: 'AED',
          },
          metadata: { orderId: '7' },
        },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(event));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest('hex');

    await expect(
      provider.verifyWebhook(event, `t=${timestamp},v1=${signature}`, rawBody),
    ).resolves.toMatchObject({
      eventId: 'evt_checkout_paid_123',
      transactionId: 'cs_test_checkout123',
      orderId: 7,
      status: 'paid',
      amount: 719.1,
      currency: 'AED',
    });
  });

  it('keeps an asynchronously payable completed session pending', async () => {
    const event = {
      id: 'evt_checkout_pending_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_checkout123',
          paymentStatus: 'unpaid',
          amountTotal: 9_850_000,
          currency: 'EGP',
          presentmentDetails: {
            amountTotal: 71_910,
            currency: 'AED',
          },
          metadata: { orderId: '7' },
        },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(event));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest('hex');

    await expect(
      provider.verifyWebhook(event, `t=${timestamp},v1=${signature}`, rawBody),
    ).resolves.toMatchObject({ status: 'pending' });
  });

  it('rejects a stale signature before trusting the event', async () => {
    const rawBody = Buffer.from('{}');
    const timestamp = (Math.floor(Date.now() / 1000) - 301).toString();
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest('hex');

    await expect(
      provider.verifyWebhook({}, `t=${timestamp},v1=${signature}`, rawBody),
    ).rejects.toThrow(BadRequestException);
  });
});
