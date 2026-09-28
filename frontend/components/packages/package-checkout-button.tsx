'use client';

import { ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthModal } from '@/components/auth/auth-modal';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { isApiError, ordersApi, paymentsApi } from '@/lib/api';
import { useCopy } from '@/lib/i18n/use-copy';
import type { CareerPackage, CheckoutPricing } from '@/types/domain';

interface PackageCheckoutButtonProps {
  checkoutHref: string;
  checkoutMode: 'manual' | 'disabled' | 'demo' | 'gateway';
  className?: string;
  containerClassName?: string;
  label: string;
  labelAr: string;
  packageItem: CareerPackage;
  pricing: CheckoutPricing | null;
  size?: Extract<ButtonProps['size'], 'sm' | 'md' | 'lg'>;
}

export function PackageCheckoutButton({
  checkoutHref,
  checkoutMode,
  className,
  containerClassName,
  label,
  labelAr,
  packageItem,
  pricing,
  size = 'lg',
}: PackageCheckoutButtonProps) {
  const _copy = useCopy();
  const pathname = usePathname();
  const router = useRouter();
  const openAuthModal = useAuthModal();
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isStartingOrder, setIsStartingOrder] = useState(false);

  async function startOrder() {
    if (checkoutMode === 'disabled') {
      const query = new URLSearchParams({
        amount: (pricing?.finalAmount ?? packageItem.price).toFixed(2),
        orderId: 'SANAD-PREVIEW',
        txn: 'xpay-pending-activation',
      });
      router.push(`/checkout/pay?${query.toString()}`);
      return;
    }
    if (checkoutMode === 'gateway') {
      router.push(checkoutHref);
      return;
    }

    if (!isAuthenticated || !user) {
      openAuthModal(pathname);
      return;
    }

    setError(null);
    setIsStartingOrder(true);
    try {
      const order = await ordersApi.create({
        packageId: packageItem.id,
        offerId: pricing?.offerId ?? undefined,
        couponCode: pricing?.couponCode ?? undefined,
        customerPhone: user.phone?.trim() ?? '',
      });
      if (checkoutMode === 'demo') {
        const payment = await paymentsApi.create({
          orderId: order.id,
          paymentMethod: 'card',
        });
        if (!payment.paymentUrl) {
          throw new Error('The payment session did not return a payment URL.');
        }
        const destination = new URL(payment.paymentUrl, window.location.origin);
        router.push(
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
        return;
      }
      const query = new URLSearchParams({
        amount: order.finalAmount.toFixed(2),
        orderId: order.orderNumber,
        txn: `preview-${order.id}`,
      });
      router.push(`/checkout/pay?${query.toString()}`);
    } catch (requestError) {
      setError(
        isApiError(requestError)
          ? requestError.userMessage
          : _copy('We could not start your order.', 'تعذر بدء طلبك.'),
      );
    } finally {
      setIsStartingOrder(false);
    }
  }

  return (
    <div className={containerClassName}>
      <Button
        className={className}
        disabled={isStartingOrder}
        onClick={startOrder}
        size={size}
      >
        {isStartingOrder
          ? _copy('Starting secure payment...', 'جارٍ تجهيز الدفع الآمن...')
          : checkoutMode === 'disabled' || checkoutMode === 'demo'
            ? _copy('Complete order', 'إتمام الطلب')
            : _copy(label, labelAr)}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1 rtl:rotate-180 rtl:motion-safe:group-hover:-translate-x-1"
        />
      </Button>
      {checkoutMode === 'disabled' ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {_copy(
            'Visual preview only. No order or payment will be created.',
            'معاينة مرئية فقط. لن يتم إنشاء طلب أو تحصيل أي مبلغ.',
          )}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs leading-5 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
