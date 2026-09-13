import { useCopy } from '@/lib/i18n/use-copy';
import { PackageOfferBanner } from '@/components/packages/package-offer-visual';
import {
  getBestPackageOffer,
  getPackageCurrentPrice,
} from '@/lib/packages/presentation';
import { cn } from '@/lib/utils/cn';
import type { CareerPackage } from '@/types/domain';

interface PackagePriceProps {
  className?: string;
  packageItem: CareerPackage;
  size?: 'card' | 'hero';
}

export function PackagePrice({
  className,
  packageItem,
  size = 'card',
}: PackagePriceProps) {
  const _copy = useCopy();

  const offer = getBestPackageOffer(packageItem);
  const currentPrice = getPackageCurrentPrice(packageItem);

  return (
    <div
      className={cn(
        className,
        offer && 'overflow-hidden rounded-lg border-2 border-accent shadow-sm',
      )}
    >
      {offer ? (
        <PackageOfferBanner className="rounded-none shadow-none" offer={offer} />
      ) : null}

      <div
        className={cn(
          'flex flex-wrap items-end justify-between gap-x-4 gap-y-3',
          offer && 'bg-surface-muted px-4 py-3',
        )}
      >
        <div>
          {offer ? (
            <span className="block text-xs font-semibold text-muted-foreground">
              {_copy('Offer price', 'السعر بعد الخصم')}
            </span>
          ) : null}
          <p
            className={cn(
              'font-display leading-none text-primary',
              offer && 'mt-1',
              size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-3xl',
            )}
          >
            {!offer ? (
              <span className="sr-only">{_copy('Current price:')}</span>
            ) : null}
            {_copy(_copy.money(currentPrice))}
          </p>
        </div>

        {offer ? (
          <div>
            <span className="block text-xs text-muted-foreground">
              {_copy('Original price', 'السعر قبل الخصم')}
            </span>
            <p className="mt-1 text-base text-muted-foreground line-through">
              {_copy(_copy.money(packageItem.price))}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
