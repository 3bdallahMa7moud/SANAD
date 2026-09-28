export type CheckoutPaymentMethod = 'card';

export interface CreatePaymentInput {
  orderId: number;
  paymentMethod: CheckoutPaymentMethod;
  returnUrl?: string;
}

export interface PaymentResult {
  paymentId: number;
  transactionId: string;
  paymentUrl: string | null;
  clientSecret: string | null;
  amount: number;
  chargedAmount: number | null;
  currency: string;
  status: string;
  bypassed: boolean;
  requiresPayment: boolean;
  reused: boolean;
}

export interface ConfirmDemoPaymentInput {
  transactionId: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
}

export interface DemoPaymentConfirmation {
  orderId: number;
  orderNumber: string;
  status: string;
  amount: number;
  chargedAmount: number;
  currency: string;
  testMode: boolean;
  idempotent: boolean;
  redirectUrl: string;
}
