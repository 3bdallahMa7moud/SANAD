'use client';

import { loadXPay, type Elements, type PaymentElement } from '@xpayeg/sdk';
import { useEffect, useRef, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/lib/i18n/use-copy';

interface XPayElementsFormProps {
  clientSecret: string;
  customer: { name?: string; email?: string; phone?: string | null };
  locale?: 'en' | 'ar';
  onComplete: () => void;
}

export function XPayElementsForm({
  clientSecret,
  customer,
  locale = 'en',
  onComplete,
}: XPayElementsFormProps) {
  const _copy = useCopy();
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Elements | null>(null);
  const paymentElementRef = useRef<PaymentElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const publishableKey = process.env.NEXT_PUBLIC_XPAY_PUBLISHABLE_KEY?.trim();

    if (!publishableKey) {
      setError('Online card payment is not configured yet.');
      return;
    }

    void (async () => {
      try {
        const xpay = await loadXPay(publishableKey);
        if (!xpay || cancelled || !mountRef.current) return;
        const elements = xpay.elements({
          clientSecret,
          locale,
          appearance: { colorMode: 'dark' },
        });
        const paymentElement = elements.create('payment', {
          layout: 'accordion',
          defaultPaymentMethod: 'card',
        });
        elements.on('loaderror', (event) => {
          if (!cancelled) setError(event.message);
        });
        paymentElement.on('ready', () => !cancelled && setIsReady(true));
        paymentElement.on('loaderror', (event) => {
          if (!cancelled) setError(event.message);
        });
        paymentElement.mount(mountRef.current);
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
      } catch {
        if (!cancelled) setError('We could not load the secure card form.');
      }
    })();

    return () => {
      cancelled = true;
      paymentElementRef.current?.destroy();
      elementsRef.current?.destroy();
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
  }, [clientSecret, locale]);

  async function confirmPayment() {
    const elements = elementsRef.current;
    if (!elements) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const validation = await elements.submit();
      if (validation.error) {
        setError(validation.error.message);
        return;
      }
      const publishableKey = process.env.NEXT_PUBLIC_XPAY_PUBLISHABLE_KEY?.trim();
      if (!publishableKey) throw new Error('Missing XPay publishable key');
      const xpay = await loadXPay(publishableKey);
      if (!xpay) throw new Error('XPay SDK unavailable');
      const result = await xpay.confirmPayment({
        elements,
        customerDetails: {
          ...(customer.name ? { name: customer.name } : {}),
          ...(customer.email ? { email: customer.email } : {}),
          ...(customer.phone ? { phone: customer.phone } : {}),
        },
      });
      if (result.type === 'error') {
        setError(result.error.message);
        return;
      }
      onComplete();
    } catch {
      setError('We could not confirm the payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
        {_copy('Secure card payment')}
      </p>
      <h2 className="type-h3 mt-2 text-primary">
        {_copy('Complete your payment')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {_copy('Your card details are handled securely by XPay.')}
      </p>
      <div className="mt-6 min-h-28" ref={mountRef} />
      {error ? (
        <Alert className="mt-4" description={_copy(error)} variant="error" />
      ) : null}
      <Button
        className="mt-6 w-full"
        disabled={!isReady || isSubmitting}
        onClick={confirmPayment}
        size="lg"
      >
        {isSubmitting ? _copy('Confirming payment...') : _copy('Pay securely')}
      </Button>
    </section>
  );
}
