import { describe, expect, it } from 'vitest';

import {
  firstValidWhatsAppPhone,
  getPaymentDisplayAmount,
  isConfirmedDemoPayment,
  normalizeWhatsAppPhone,
  whatsappHref,
} from './presentation';

describe('WhatsApp phone presentation', () => {
  it('keeps an international phone number and removes formatting', () => {
    expect(normalizeWhatsAppPhone('+971 50 123 4567')).toBe('971501234567');
  });

  it('converts an existing Egyptian local mobile number to international form', () => {
    expect(normalizeWhatsAppPhone('01012113400')).toBe('201012113400');
  });

  it('supports an international number with the 00 prefix', () => {
    expect(normalizeWhatsAppPhone('0020 101 211 3400')).toBe('201012113400');
  });

  it('rejects missing and unusable phone numbers', () => {
    expect(normalizeWhatsAppPhone(null)).toBeNull();
    expect(normalizeWhatsAppPhone('123')).toBeNull();
  });

  it('builds an encoded wa.me link', () => {
    expect(whatsappHref('01012113400', 'Order #SANAD-1')).toBe(
      'https://wa.me/201012113400?text=Order%20%23SANAD-1',
    );
  });

  it('uses the first valid configured WhatsApp contact', () => {
    expect(
      firstValidWhatsAppPhone('', null, '01012113400', '+971501234567'),
    ).toBe('201012113400');
    expect(firstValidWhatsAppPhone('', 'invalid', undefined)).toBeNull();
  });
});

describe('demo payment presentation', () => {
  const demoPayment = {
    amount: 0,
    status: 'paid',
    transaction_id: 'demo_confirmed-payment',
    payment_response: {
      displayAmount: 79,
      testMode: true,
    },
  };

  it('recognizes only a confirmed test payment', () => {
    expect(isConfirmedDemoPayment(demoPayment)).toBe(true);
    expect(isConfirmedDemoPayment({ ...demoPayment, status: 'pending' })).toBe(
      false,
    );
  });

  it('shows the tested order value while the charged amount remains zero', () => {
    expect(getPaymentDisplayAmount(demoPayment, 100)).toBe(79);
    expect(
      getPaymentDisplayAmount(
        {
          amount: 125,
          status: 'paid',
          transaction_id: 'xpay_real-payment',
        },
        100,
      ),
    ).toBe(125);
  });
});
