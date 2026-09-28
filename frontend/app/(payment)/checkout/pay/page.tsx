import type { Metadata } from 'next';
import { SecurePaymentPage } from '@/components/checkout/secure-payment-page';
import { getLocalizedMetadata } from '@/lib/i18n/metadata';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function paymentAmount(value: string | undefined): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 9_999_999.99
    ? amount
    : 719.1;
}

function paymentLabel(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 80) : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    title: 'Secure Payment | SANAD',
    description: 'Complete your SANAD card payment securely.',
    robots: { index: false, follow: false },
  });
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;

  return (
    <SecurePaymentPage
      amount={paymentAmount(firstValue(query.amount))}
      orderId={paymentLabel(firstValue(query.orderId), 'SANAD')}
      transactionId={paymentLabel(firstValue(query.txn), 'invalid-session')}
    />
  );
}
