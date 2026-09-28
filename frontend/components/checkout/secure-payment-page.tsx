'use client';

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isApiError, paymentsApi } from '@/lib/api';
import { useCopy } from '@/lib/i18n/use-copy';

interface SecurePaymentPageProps {
  amount: number;
  orderId: string;
  transactionId: string;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

export function SecurePaymentPage({
  amount,
  orderId,
  transactionId,
}: SecurePaymentPageProps) {
  const _copy = useCopy();
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardholderName, setCardholderName] = useState('SANAD TEST');
  const [expiry, setExpiry] = useState('12/30');
  const [cvc, setCvc] = useState('123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuccessful) return;
    const timeout = window.setTimeout(() => {
      router.replace('/my-orders?payment=success');
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [isSuccessful, router]);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const confirmation = await paymentsApi.confirmDemo({
        transactionId,
        cardNumber,
        expiry,
        cvc,
        cardholderName,
      });
      if (confirmation.status.toLowerCase() !== 'paid') {
        throw new Error('Payment confirmation did not complete.');
      }
      setIsSuccessful(true);
    } catch (requestError) {
      setError(
        isApiError(requestError)
          ? requestError.userMessage
          : _copy(
              'Payment could not be completed. Please try again.',
              'تعذر إتمام الدفع. يرجى المحاولة مرة أخرى.',
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-surface-muted py-6 sm:py-14">
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="layout-container">
        <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between gap-4">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary transition-colors hover:bg-surface"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {_copy('Back to checkout', 'العودة لإتمام الطلب')}
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            {_copy('Secure payment', 'دفع آمن')}
          </span>
        </div>

        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-lg lg:grid-cols-[minmax(0,1fr)_21rem]">
          <main className="p-6 sm:p-9 lg:p-11">
            <div className="flex items-center justify-between gap-5 border-b border-border pb-7">
              <BrandLogo size="sm" />
              <div className="flex items-center gap-2 text-xs font-semibold text-success">
                <ShieldCheck aria-hidden="true" className="size-4" />
                {_copy('Protected checkout', 'صفحة دفع محمية')}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                {_copy(
                  'Pay securely by bank card',
                  'ادفع بأمان بالبطاقة البنكية',
                )}
              </p>
              <h1 className="type-h3 mt-2 text-primary">
                {_copy('Complete your payment', 'أكمل عملية الدفع')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {_copy(
                  'Enter the card details below to confirm your order.',
                  'أدخل بيانات البطاقة أدناه لتأكيد طلبك.',
                )}
              </p>
            </div>

            <div className="mt-7 flex min-h-20 items-center gap-3 rounded-xl border border-primary bg-primary/5 p-4 text-primary">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-muted">
                <CreditCard aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  {_copy('Bank card', 'بطاقة بنكية')}
                </span>
                <span className="mt-1 block text-xs">Visa / Mastercard</span>
              </span>
              <span className="ms-auto grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-surface-muted p-4 text-sm">
              <p className="font-semibold text-primary">
                {_copy('Test card details', 'بيانات البطاقة التجريبية')}
              </p>
              <p
                className="mt-2 font-mono text-xs leading-6 text-muted-foreground"
                dir="ltr"
              >
                4242 4242 4242 4242 · 12/30 · 123 · SANAD TEST
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {_copy(
                  'This restricted test confirms the order without charging real money.',
                  'هذا الاختبار المقيد يؤكد الطلب بدون خصم أموال حقيقية.',
                )}
              </p>
            </div>

            <form
              className="mt-8 grid gap-5"
              data-testid="card-payment"
              onSubmit={submitPayment}
            >
              <div>
                <label
                  className="type-label text-foreground"
                  htmlFor="card-number"
                >
                  {_copy('Card number', 'رقم البطاقة')}
                </label>
                <div className="relative mt-2" dir="ltr">
                  <Input
                    autoComplete="cc-number"
                    className="pl-3 pr-24 font-mono tracking-[0.1em]"
                    disabled={isSubmitting || isSuccessful}
                    id="card-number"
                    inputMode="numeric"
                    maxLength={19}
                    onChange={(event) =>
                      setCardNumber(formatCardNumber(event.target.value))
                    }
                    required
                    value={cardNumber}
                  />
                  <div
                    aria-label="Visa and Mastercard accepted"
                    className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2"
                  >
                    <span className="text-[0.65rem] font-black tracking-tight text-[#1434CB] italic">
                      VISA
                    </span>
                    <span
                      aria-label="Mastercard"
                      className="relative block h-4 w-7"
                    >
                      <span className="absolute top-0 left-0 size-4 rounded-full bg-[#EB001B]" />
                      <span className="absolute top-0 right-0 size-4 rounded-full bg-[#F79E1B] opacity-90" />
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="type-label text-foreground"
                  htmlFor="card-name"
                >
                  {_copy('Name on card', 'الاسم على البطاقة')}
                </label>
                <Input
                  autoComplete="cc-name"
                  className="mt-2 uppercase"
                  disabled={isSubmitting || isSuccessful}
                  id="card-name"
                  onChange={(event) =>
                    setCardholderName(event.target.value.toUpperCase())
                  }
                  required
                  value={cardholderName}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="type-label text-foreground"
                    htmlFor="card-expiry"
                  >
                    {_copy('Expiry date', 'تاريخ الانتهاء')}
                  </label>
                  <Input
                    autoComplete="cc-exp"
                    className="mt-2 font-mono"
                    dir="ltr"
                    disabled={isSubmitting || isSuccessful}
                    id="card-expiry"
                    inputMode="numeric"
                    maxLength={5}
                    onChange={(event) =>
                      setExpiry(formatExpiry(event.target.value))
                    }
                    required
                    value={expiry}
                  />
                </div>
                <div>
                  <label
                    className="type-label text-foreground"
                    htmlFor="card-cvc"
                  >
                    CVC
                  </label>
                  <Input
                    autoComplete="cc-csc"
                    className="mt-2 font-mono"
                    dir="ltr"
                    disabled={isSubmitting || isSuccessful}
                    id="card-cvc"
                    inputMode="numeric"
                    maxLength={3}
                    onChange={(event) =>
                      setCvc(event.target.value.replace(/\D/g, '').slice(0, 3))
                    }
                    required
                    type="password"
                    value={cvc}
                  />
                </div>
              </div>

              {error ? (
                <Alert
                  description={error}
                  title={_copy('Payment was not completed', 'لم يكتمل الدفع')}
                  variant="error"
                />
              ) : null}
              {isSuccessful ? (
                <Alert
                  description={_copy(
                    'Your order is confirmed. Customer service will contact you soon. Redirecting to My Orders...',
                    'تم تأكيد طلبك، وسيتواصل معك فريق خدمة العملاء قريبًا. جارٍ نقلك إلى طلباتي...',
                  )}
                  icon={<CheckCircle2 />}
                  title={_copy('Payment successful', 'تم الدفع بنجاح')}
                  variant="success"
                />
              ) : null}

              <Button
                className="mt-1 w-full"
                disabled={isSuccessful}
                loading={isSubmitting}
                loadingLabel={_copy(
                  'Confirming payment...',
                  'جارٍ تأكيد الدفع...',
                )}
                size="lg"
                type="submit"
              >
                <LockKeyhole aria-hidden="true" className="size-4" />
                {_copy('Pay', 'ادفع')} {_copy(_copy.money(amount, 'AED'))}
              </Button>
            </form>
          </main>

          <aside className="border-t border-border bg-primary p-6 text-primary-foreground sm:p-8 lg:border-t-0 lg:border-s">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/70 uppercase">
              {_copy('Order summary', 'ملخص الطلب')}
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              {_copy('SANAD career service', 'خدمة سند المهنية')}
            </h2>

            <dl className="mt-8 grid gap-5 text-sm">
              <div>
                <dt className="text-primary-foreground/65">
                  {_copy('Order', 'الطلب')}
                </dt>
                <dd className="mt-1 break-all font-semibold">#{orderId}</dd>
              </div>
              <div>
                <dt className="text-primary-foreground/65">
                  {_copy('Payment reference', 'مرجع الدفع')}
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {transactionId}
                </dd>
              </div>
              <div className="border-t border-primary-foreground/20 pt-5">
                <dt className="text-primary-foreground/65">
                  {_copy('Total due', 'الإجمالي المستحق')}
                </dt>
                <dd className="mt-2 text-3xl font-semibold">
                  {_copy(_copy.money(amount, 'AED'))}
                </dd>
              </div>
            </dl>

            <div className="mt-10 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-accent"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {_copy('Protected payment', 'دفع محمي')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-primary-foreground/70">
                    {_copy(
                      'Card details are checked for this restricted test and are not saved.',
                      'يتم التحقق من بيانات البطاقة لهذا الاختبار المقيد ولا يتم حفظها.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
