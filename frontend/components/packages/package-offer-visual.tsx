import { useCopy } from '@/lib/i18n/use-copy';
import { Tag } from 'lucide-react';
import type { PackageOffer } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

export function PackageOfferFlag({
  discountPercentage,
  className,
}: {
  discountPercentage: number;
  className?: string;
}) {
  const _copy = useCopy();

  return (
    <span
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground shadow-md',
        className,
      )}
    >
      <Tag aria-hidden="true" className="size-4 shrink-0" />
      {_copy('Save', 'خصم')}{' '}
      <bdi dir="ltr">{_copy(discountPercentage)}%</bdi>
    </span>
  );
}

export function PackageOfferBanner({
  offer,
  className,
}: {
  offer: PackageOffer;
  className?: string;
}) {
  const _copy = useCopy();
  const name = _copy(offer.name, offer.nameAr);
  const includesPercentage =
    name.includes(`${offer.discountPercentage}%`) ||
    name.includes(`%${offer.discountPercentage}`);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-accent-foreground shadow-sm',
        className,
      )}
    >
      <Tag aria-hidden="true" className="size-5 shrink-0" />
      <strong className="min-w-0 flex-1 text-sm leading-6 sm:text-base">
        <bdi dir="auto">{name}</bdi>
      </strong>
      {!includesPercentage ? (
        <bdi className="text-base font-bold" dir="ltr">
          {_copy(offer.discountPercentage)}%
        </bdi>
      ) : null}
    </div>
  );
}
