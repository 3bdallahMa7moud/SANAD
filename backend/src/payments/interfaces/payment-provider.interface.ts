export const PAYMENT_PROVIDER_TOKEN = 'PAYMENT_PROVIDER_TOKEN';

export interface CreatePaymentParams {
  orderId: number;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl?: string;
  attemptNumber?: number;
}

export interface PaymentIntentResult {
  transactionId: string;
  paymentUrl?: string | null;
  clientSecret?: string | null;
  provider: string;
  amount: number;
  currency: string;
}

export interface WebhookEventPayload {
  transactionId: string;
  orderId: number;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  rawPayload: Record<string, any>;
  eventId?: string;
}

export interface PaymentProvider {
  createPaymentIntent(
    params: CreatePaymentParams,
  ): Promise<PaymentIntentResult>;
  verifyWebhook(
    payload: any,
    signature: string,
    rawBody: Buffer,
  ): Promise<WebhookEventPayload>;
}
