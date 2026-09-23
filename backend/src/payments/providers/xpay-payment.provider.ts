import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  CreatePaymentParams,
  PaymentIntentResult,
  PaymentProvider,
  WebhookEventPayload,
} from '../interfaces/payment-provider.interface';

const WEBHOOK_TOLERANCE_SECONDS = 300;
const CHECKOUT_HOST = 'checkout.xpay.app';

interface XPayCheckoutSession {
  id?: unknown;
  url?: unknown;
  amountTotal?: unknown;
  currency?: unknown;
  presentmentDetails?: {
    amountTotal?: unknown;
    currency?: unknown;
  };
}

interface XPayCheckoutEvent {
  id?: unknown;
  type?: unknown;
  data?: {
    object?: {
      id?: unknown;
      amountTotal?: unknown;
      currency?: unknown;
      presentmentDetails?: {
        amountTotal?: unknown;
        currency?: unknown;
      };
      paymentStatus?: unknown;
      metadata?: Record<string, unknown>;
    };
  };
}

@Injectable()
export class XPayPaymentProvider implements PaymentProvider {
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly apiBaseUrl: string;
  private readonly frontendUrl: string;

  constructor(configService: ConfigService) {
    this.secretKey = configService.getOrThrow<string>('XPAY_SECRET_KEY');
    this.webhookSecret = configService.getOrThrow<string>(
      'XPAY_WEBHOOK_SECRET',
    );
    this.apiBaseUrl = (
      configService.get<string>('XPAY_API_BASE_URL') || 'https://api.xpay.app'
    ).replace(/\/+$/, '');
    this.frontendUrl = (
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'
    ).replace(/\/+$/, '');
  }

  async createPaymentIntent(
    params: CreatePaymentParams,
  ): Promise<PaymentIntentResult> {
    const amountInMinorUnits = Math.round(params.amount * 100);
    if (!Number.isSafeInteger(amountInMinorUnits) || amountInMinorUnits <= 0) {
      throw new BadRequestException({
        message: 'Payment amount is invalid',
        code: 'INVALID_PAYMENT_AMOUNT',
      });
    }

    const returnUrl =
      params.returnUrl || `${this.frontendUrl}/my-orders/${params.orderId}`;
    const requestBody = {
      mode: 'payment',
      uiMode: 'hosted',
      submitType: 'PAY',
      afterCompletion: {
        type: 'redirect',
        redirect: { url: returnUrl },
      },
      cancelUrl: `${this.frontendUrl}/my-orders/${params.orderId}`,
      lineItems: [
        {
          priceData: {
            currency: params.currency,
            unitAmount: amountInMinorUnits,
            productData: { name: `SANAD order ${params.orderNumber}` },
          },
          quantity: 1,
        },
      ],
      customerDetails: {
        name: params.customerName,
        email: params.customerEmail,
        ...(params.customerPhone ? { phone: params.customerPhone } : {}),
      },
      paymentMethodTypes: ['card'],
      metadata: {
        orderId: String(params.orderId),
        orderNumber: params.orderNumber,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': this.createIdempotencyKey(params),
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new BadGatewayException({
        message: 'The payment provider is temporarily unavailable',
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
      });
    }

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'The payment provider could not create a checkout session',
        code: 'PAYMENT_PROVIDER_ERROR',
      });
    }

    let session: XPayCheckoutSession;
    try {
      session = (await response.json()) as XPayCheckoutSession;
    } catch {
      throw new BadGatewayException({
        message: 'The payment provider returned an invalid response',
        code: 'INVALID_PAYMENT_PROVIDER_RESPONSE',
      });
    }

    const transactionId =
      typeof session.id === 'string' ? session.id.trim() : '';
    const paymentUrl =
      typeof session.url === 'string' ? session.url.trim() : '';
    // XPay currently settles in EGP. For an AED-priced order the top-level
    // amount/currency are the processing track, while presentmentDetails is
    // the exact customer-facing AED track that must match SANAD's order.
    const customerFacing = this.customerFacingAmount(session || {});

    if (
      !transactionId.startsWith('cs_') ||
      !this.isTrustedCheckoutUrl(paymentUrl) ||
      customerFacing.amountInMinorUnits !== amountInMinorUnits ||
      customerFacing.currency !== params.currency.toUpperCase()
    ) {
      throw new BadGatewayException({
        message: 'The payment provider returned an invalid checkout session',
        code: 'INVALID_PAYMENT_PROVIDER_RESPONSE',
      });
    }

    return {
      transactionId,
      paymentUrl,
      provider: 'xpay',
      amount: customerFacing.amountInMinorUnits / 100,
      currency: customerFacing.currency,
    };
  }

  async verifyWebhook(
    _payload: unknown,
    signature: string,
    rawBody: Buffer,
  ): Promise<WebhookEventPayload> {
    this.verifySignature(signature, rawBody);

    let event: XPayCheckoutEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as XPayCheckoutEvent;
    } catch {
      throw this.invalidWebhook('Invalid webhook JSON');
    }

    const eventId = typeof event.id === 'string' ? event.id : undefined;
    const eventType = typeof event.type === 'string' ? event.type : '';
    const session = event.data?.object;
    const transactionId =
      typeof session?.id === 'string' ? session.id.trim() : '';
    const orderId = Number(session?.metadata?.orderId);
    const customerFacing = this.customerFacingAmount(session || {});

    if (
      !eventId ||
      !transactionId.startsWith('cs_') ||
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      !Number.isSafeInteger(customerFacing.amountInMinorUnits) ||
      customerFacing.amountInMinorUnits <= 0 ||
      !/^[A-Z]{3}$/.test(customerFacing.currency)
    ) {
      throw this.invalidWebhook('Invalid XPay checkout event');
    }

    const successfulEvent =
      eventType === 'checkout.session.completed' ||
      eventType === 'checkout.session.async_payment_succeeded';
    let status: WebhookEventPayload['status'];
    if (successfulEvent && session?.paymentStatus === 'paid') {
      status = 'paid';
    } else if (
      eventType === 'checkout.session.async_payment_failed' ||
      eventType === 'checkout.session.expired'
    ) {
      status = 'failed';
    } else if (
      eventType === 'checkout.session.completed' &&
      session?.paymentStatus === 'unpaid'
    ) {
      status = 'pending';
    } else {
      throw this.invalidWebhook('Unsupported XPay checkout event');
    }

    return {
      transactionId,
      orderId,
      status,
      amount: customerFacing.amountInMinorUnits / 100,
      currency: customerFacing.currency,
      rawPayload: event as Record<string, any>,
      eventId,
    };
  }

  private createIdempotencyKey(params: CreatePaymentParams): string {
    const digest = crypto
      .createHmac('sha256', this.secretKey)
      .update(
        `checkout:${params.orderId}:${params.orderNumber}:${params.attemptNumber}`,
      )
      .digest('hex');
    return `sanad_${digest}`;
  }

  private customerFacingAmount(session: {
    amountTotal?: unknown;
    currency?: unknown;
    presentmentDetails?: {
      amountTotal?: unknown;
      currency?: unknown;
    };
  }): { amountInMinorUnits: number; currency: string } {
    const track = session.presentmentDetails || session;
    return {
      amountInMinorUnits: Number(track.amountTotal),
      currency:
        typeof track.currency === 'string'
          ? track.currency.trim().toUpperCase()
          : '',
    };
  }

  private isTrustedCheckoutUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === CHECKOUT_HOST;
    } catch {
      return false;
    }
  }

  private verifySignature(signatureHeader: string, rawBody: Buffer): void {
    if (!signatureHeader || !rawBody.length) {
      throw this.invalidWebhook('Missing webhook signature');
    }

    const parts = new Map<string, string>();
    for (const part of signatureHeader.split(',')) {
      const separator = part.indexOf('=');
      if (separator > 0) {
        parts.set(part.slice(0, separator).trim(), part.slice(separator + 1));
      }
    }

    const timestampText = parts.get('t') || '';
    const timestamp = Number(timestampText);
    const receivedSignature = parts.get('v1')?.trim().toLowerCase() || '';
    const now = Math.floor(Date.now() / 1000);
    if (
      !/^\d+$/.test(timestampText) ||
      !Number.isSafeInteger(timestamp) ||
      Math.abs(now - timestamp) > WEBHOOK_TOLERANCE_SECONDS ||
      !/^[a-f0-9]{64}$/.test(receivedSignature)
    ) {
      throw this.invalidWebhook('Invalid webhook signature');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(timestampText)
      .update('.')
      .update(rawBody)
      .digest('hex');
    const provided = Buffer.from(receivedSignature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      throw this.invalidWebhook('Invalid webhook signature');
    }
  }

  private invalidWebhook(message: string): BadRequestException {
    return new BadRequestException({
      message,
      code: 'INVALID_WEBHOOK_PAYLOAD',
    });
  }
}
