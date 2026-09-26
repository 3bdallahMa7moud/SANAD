'use client';

import { useCopy } from '@/lib/i18n/use-copy';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { PackagePrice } from '@/components/packages/package-price';
import { SecondaryPrices } from '@/components/packages/secondary-prices';
import type { SecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import {
  PackageOfferBanner,
  PackageOfferFlag,
} from '@/components/packages/package-offer-visual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/components/auth/auth-modal';
import { checkoutApi, isApiError, ordersApi } from '@/lib/api';
import {
  getBestPackageOffer,
  getPackageCurrentPrice,
  formatDeliveryEstimate,
} from '@/lib/packages/presentation';
import type { CareerPackage, CheckoutPricing } from '@/types/domain';
import { formatMoney } from '@/lib/orders/presentation';

interface PackageOrderCardProps {
  checkoutHref: string;
  packageItem: CareerPackage;
  pricing: CheckoutPricing | null;
  rates?: SecondaryExchangeRates | null;
  checkoutMode: 'manual' | 'gateway';
}

export function PackageOrderCard({
  checkoutHref,
  packageItem,
  pricing,
  rates = null,
  checkoutMode,
}: PackageOrderCardProps) {
  const _copy = useCopy();
  const pathname = usePathname();
  const router = useRouter();
  const openAuthModal = useAuthModal();
  const { user, isAuthenticated } = useAuth();
  const [displayPricing, setDisplayPricing] = useState(pricing);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isStartingOrder, setIsStartingOrder] = useState(false);

  const bestOffer = getBestPackageOffer(packageItem);
  const companionOffers = [...(packageItem.companionOffers ?? [])].sort(
    (first, second) => second.discountPercentage - first.discountPercentage,
  );

  async function applyCoupon() {
    const normalizedCode = couponCode.trim();
    if (!normalizedCode) {
      setCouponError(_copy('Enter a coupon code.', 'أدخل كود الخصم.'));
      return;
    }
    setCouponError(null);
    setIsApplyingCoupon(true);
    try {
      const nextPricing = await checkoutApi.preview({
        packageId: packageItem.id,
        offerId: pricing?.offerId ?? undefined,
        couponCode: normalizedCode,
      });
      setDisplayPricing(nextPricing);
    } catch (error) {
      setCouponError(
        isApiError(error)
          ? error.userMessage
          : _copy('This coupon could not be applied.', 'تعذر تطبيق الكوبون.'),
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function startOrder() {
    if (checkoutMode === 'gateway') {
      const query = displayPricing?.couponCode
        ? `?coupon=${encodeURIComponent(displayPricing.couponCode)}`
        : '';
      router.push(`${checkoutHref}${query}`);
      return;
    }
    if (!isAuthenticated || !user) {
      openAuthModal(pathname);
      return;
    }
    setCouponError(null);
    setIsStartingOrder(true);
    try {
      const order = await ordersApi.create({
        packageId: packageItem.id,
        offerId: displayPricing?.offerId ?? undefined,
        couponCode: displayPricing?.couponCode ?? undefined,
        customerPhone: user.phone?.trim() ?? '',
      });
      const query = new URLSearchParams({
        amount: order.finalAmount.toFixed(2),
        orderId: order.orderNumber,
        txn: `preview-${order.id}`,
      });
      router.push(`/checkout/pay?${query.toString()}`);
    } catch (error) {
      setCouponError(
        isApiError(error)
          ? error.userMessage
          : _copy('We could not start your order.', 'تعذر بدء طلبك.'),
      );
    } finally {
      setIsStartingOrder(false);
    }
  }

  return (
    <aside
      aria-label={_copy('Order summary')}
      className="overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-md"
    >
      <div className="border-b border-border bg-surface-muted px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-secondary uppercase">
            {_copy('Order summary')}
          </p>
          <ShieldCheck aria-hidden="true" className="size-5 text-accent" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-primary">
          {_copy(packageItem.name, packageItem.nameAr)}
        </h2>
      </div>

      <div className="p-6">
        {displayPricing ? (
          <>
            {displayPricing.offerDiscountPercentage > 0 ? (
              bestOffer ? (
                <PackageOfferBanner className="mb-4" offer={bestOffer} />
              ) : (
                <PackageOfferFlag
                  className="mb-4"
                  discountPercentage={displayPricing.offerDiscountPercentage}
                />
              )
            ) : null}
            <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {_copy(
                displayPricing.offerDiscountPercentage > 0
                  ? 'Offer price'
                  : 'Total',
                displayPricing.offerDiscountPercentage > 0
                  ? 'السعر بعد الخصم'
                  : 'الإجمالي',
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="font-display text-4xl leading-none text-primary">
                {_copy(
                  _copy.money(
                    displayPricing.finalAmount,
                    displayPricing.currency,
                  ),
                )}
              </p>
              {displayPricing.offerDiscountAmount > 0 ? (
                <div className="pb-0.5">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {_copy('Original price', 'السعر قبل الخصم')}
                  </span>
                  <p className="mt-0.5 text-base text-muted-foreground line-through">
                    {_copy(
                      _copy.money(
                        displayPricing.originalPrice,
                        displayPricing.currency,
                      ),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
            <SecondaryPrices
              amount={displayPricing.finalAmount}
              currency={displayPricing.currency}
              rates={rates}
            />
            {displayPricing.offerDiscountAmount +
              displayPricing.couponDiscountAmount >
            0 ? (
              <p className="mt-2 text-xs font-semibold text-success">
                {_copy('Save', 'توفير')}{' '}
                {_copy(
                  _copy.money(
                    displayPricing.offerDiscountAmount +
                      displayPricing.couponDiscountAmount,
                    displayPricing.currency,
                  ),
                )}
              </p>
            ) : null}

            <dl className="mt-6 grid gap-3 border-y border-border py-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{_copy('Subtotal')}</dt>
                <dd className="font-semibold text-foreground">
                  {_copy(
                    _copy.money(
                      displayPricing.subtotalAfterDiscounts,
                      displayPricing.currency,
                    ),
                  )}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <PackagePrice packageItem={packageItem} size="hero" rates={rates} />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {_copy(
                'The final tax and total are confirmed when your order is started.',
              )}
            </p>
          </>
        )}

        {companionOffers.length > 0 ? (
          <div className="mt-5 rounded-md border border-accent/35 bg-accent/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Tag aria-hidden="true" className="size-4 text-accent" />
              {_copy(
                'Offers unlocked with this service',
                'عروض متاحة مع هذه الخدمة',
              )}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-foreground">
              {companionOffers.map((offer) => (
                <li key={offer.id}>
                  <strong>{_copy(offer.discountPercentage)}%</strong>{' '}
                  {_copy('off', 'خصم على')}{' '}
                  {_copy(
                    offer.type === 'cross_service_any'
                      ? 'any second service'
                      : (offer.packageName ?? 'the selected second service'),
                    offer.type === 'cross_service_any'
                      ? 'أي خدمة ثانية'
                      : offer.packageNameAr,
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {_copy(
                'Choose the second service during checkout.',
                'اختر الخدمة الثانية أثناء إتمام الطلب.',
              )}
            </p>
          </div>
        ) : null}

        <dl className="mt-5 grid gap-4">
          <div>
            <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
              <Clock3 aria-hidden="true" className="size-4 text-accent" />
              {_copy('Delivery')}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-primary">
              {formatDeliveryEstimate(packageItem.deliveryDays, _copy.locale)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-5">
          <label
            className="text-sm font-semibold text-primary"
            htmlFor={`coupon-${packageItem.id}`}
          >
            {_copy('Coupon code', 'كود الخصم')}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id={`coupon-${packageItem.id}`}
              onChange={(event) => {
                setCouponCode(event.target.value);
                setCouponError(null);
              }}
              placeholder={_copy('Enter code', 'أدخل الكود')}
              value={couponCode}
            />
            <Button
              disabled={isApplyingCoupon}
              onClick={applyCoupon}
              type="button"
              variant="outline"
            >
              {isApplyingCoupon
                ? _copy('Applying...', 'جارٍ التطبيق...')
                : _copy('Apply', 'تطبيق')}
            </Button>
          </div>
          {displayPricing?.couponDiscountAmount ? (
            <p className="mt-2 text-xs font-semibold text-success">
              {_copy('Coupon applied. You save', 'تم تطبيق الكوبون. وفرت')}{' '}
              {_copy(
                _copy.money(
                  displayPricing.couponDiscountAmount,
                  displayPricing.currency,
                ),
              )}
            </p>
          ) : null}
          {couponError ? (
            <p className="mt-2 text-xs text-destructive">{couponError}</p>
          ) : null}
        </div>

        <Button
          className="group mt-6 w-full"
          disabled={isStartingOrder}
          onClick={startOrder}
          size="lg"
          type="button"
        >
          {isStartingOrder
            ? _copy('Starting order...', 'جارٍ تجهيز الطلب...')
            : _copy('Continue to payment', 'متابعة الدفع')}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Button>
        <Button asChild className="mt-3 w-full" size="lg" variant="outline">
          <Link href="#included-heading">
            {_copy('Review the service scope')}
          </Link>
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-success"
          />
          {_copy(
            'Review your order before confirming. After confirmation, continue on WhatsApp to share your requirements with SANAD.',
          )}
        </p>
      </div>
    </aside>
  );
}

export function getOrderDisplayPrice(
  packageItem: CareerPackage,
  pricing: CheckoutPricing | null,
  locale = 'en',
): string {
  return pricing
    ? formatMoney(pricing.finalAmount, pricing.currency, locale)
    : formatMoney(getPackageCurrentPrice(packageItem), 'AED', locale);
}
