import { z } from 'zod';

import type {
  ConfirmDemoPaymentInput,
  CreatePaymentInput,
  DemoPaymentConfirmation,
  PaymentResult,
} from '@/types/domain';

import { ApiError } from '../errors';
import { api } from '../request';

const decimalSchema = z
  .union([z.number(), z.string().trim().min(1)])
  .transform((value) => Number(value))
  .pipe(z.number().finite().nonnegative());

const paymentPayloadSchema = z.object({
  payment_id: z.number().int().positive(),
  transaction_id: z.string().min(1),
  payment_url: z.string().url().nullable().optional(),
  client_secret: z.string().min(1).nullable().optional(),
  amount: decimalSchema,
  charged_amount: decimalSchema.nullish(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.string().min(1),
  bypassed: z.boolean().optional(),
  requires_payment: z.boolean().optional(),
  reused: z.boolean().optional(),
});

const demoConfirmationSchema = z.object({
  order_id: z.number().int().positive(),
  order_number: z.string().min(1),
  status: z.string().min(1),
  amount: decimalSchema,
  charged_amount: decimalSchema,
  currency: z.string().regex(/^[A-Z]{3}$/),
  test_mode: z.boolean(),
  idempotent: z.boolean(),
  redirect_url: z.string().startsWith('/'),
});

export const paymentsApi = {
  async create(input: CreatePaymentInput): Promise<PaymentResult> {
    const payload = await api.post<unknown>(
      '/payments/create',
      {
        order_id: input.orderId,
        payment_method: input.paymentMethod,
        ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
      },
      { authMode: 'session' },
    );

    const result = paymentPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new ApiError({
        kind: 'unknown',
        message: 'Unexpected response shape from POST /payments/create',
      });
    }

    return {
      paymentId: result.data.payment_id,
      transactionId: result.data.transaction_id,
      paymentUrl: result.data.payment_url ?? null,
      clientSecret: result.data.client_secret ?? null,
      amount: result.data.amount,
      chargedAmount: result.data.charged_amount ?? null,
      currency: result.data.currency,
      status: result.data.status,
      bypassed: result.data.bypassed === true,
      requiresPayment: result.data.requires_payment !== false,
      reused: result.data.reused === true,
    };
  },

  async confirmDemo(
    input: ConfirmDemoPaymentInput,
  ): Promise<DemoPaymentConfirmation> {
    const payload = await api.post<unknown>(
      '/payments/demo/confirm',
      {
        transaction_id: input.transactionId,
        card_number: input.cardNumber,
        expiry: input.expiry,
        cvc: input.cvc,
        cardholder_name: input.cardholderName,
      },
      { authMode: 'session' },
    );

    const result = demoConfirmationSchema.safeParse(payload);
    if (!result.success) {
      throw new ApiError({
        kind: 'unknown',
        message: 'Unexpected response shape from POST /payments/demo/confirm',
      });
    }

    return {
      orderId: result.data.order_id,
      orderNumber: result.data.order_number,
      status: result.data.status,
      amount: result.data.amount,
      chargedAmount: result.data.charged_amount,
      currency: result.data.currency,
      testMode: result.data.test_mode,
      idempotent: result.data.idempotent,
      redirectUrl: result.data.redirect_url,
    };
  },
};
