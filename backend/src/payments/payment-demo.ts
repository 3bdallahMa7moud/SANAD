export const PAYMENT_DEMO_PROVIDER = 'demo';
export const PAYMENT_DEMO_TRANSACTION_PREFIX = 'demo_';

export const PAYMENT_DEMO_CARD = Object.freeze({
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  cardholderName: 'SANAD TEST',
});

export function normalizeDemoCardNumber(value: string): string {
  return value.replace(/[^\d]/g, '');
}
