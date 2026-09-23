import { useCopy } from '@/lib/i18n/use-copy';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

import { PackagePrice } from '@/components/packages/package-price';
import { SecondaryPrices } from '@/components/packages/secondary-prices';
import type { SecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import {
  PackageOfferBanner,
  PackageOfferFlag,
} from '@/components/packages/package-offer-visual';
import { Button } from '@/components/ui/button';
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
}

export function PackageOrderCard({
  checkoutHref,
  packageItem,
  pricing,
  rates = null,
}: PackageOrderCardProps) {
  const _copy = useCopy();

  const bestOffer = getBestPackageOffer(packageItem);
  const companionOffers = [...(packageItem.companionOffers ?? [])].sort(
    (first, second) => second.discountPercentage - first.discountPercentage,
  );

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
        {pricing ? (
          <>
            {pricing.offerDiscountPercentage > 0 ? (
              bestOffer ? (
                <PackageOfferBanner className="mb-4" offer={bestOffer} />
              ) : (
                <PackageOfferFlag
                  className="mb-4"
                  discountPercentage={pricing.offerDiscountPercentage}
                />
              )
            ) : null}
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {_copy('Total')}
            </p>
            <p className="mt-2 font-display text-4xl leading-none text-primary">
              {_copy(_copy.money(pricing.finalAmount, pricing.currency))}
            </p>
            <SecondaryPrices
              amount={pricing.finalAmount}
              currency={pricing.currency}
              rates={rates}
            />

            <dl className="mt-6 grid gap-3 border-y border-border py-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  {_copy('Original price')}
                </dt>
                <dd className="font-semibold text-foreground">
                  {_copy(_copy.money(pricing.originalPrice, pricing.currency))}
                </dd>
              </div>
              {pricing.offerDiscountAmount > 0 ? (
                <div className="flex items-center justify-between gap-4 text-success">
                  <dt>{_copy('Offer saving')}</dt>
                  <dd className="font-semibold">
                    {_copy('−')}
                    {_copy(
                      _copy.money(
                        pricing.offerDiscountAmount,
                        pricing.currency,
                      ),
                    )}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{_copy('Subtotal')}</dt>
                <dd className="font-semibold text-foreground">
                  {_copy(
                    _copy.money(
                      pricing.subtotalAfterDiscounts,
                      pricing.currency,
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

        <Button asChild className="group mt-6 w-full" size="lg">
          <Link href={checkoutHref}>
            {_copy('Continue to checkout')}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
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
