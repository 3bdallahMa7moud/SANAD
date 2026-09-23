import { useCopy } from '@/lib/i18n/use-copy';
import {
  ArrowRight,
  Clock3,
  FileText,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { PackagePrice } from '@/components/packages/package-price';
import type { SecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import { PackageOfferFlag } from '@/components/packages/package-offer-visual';
import { PackageSocialProof } from '@/components/packages/package-social-proof';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getPackageHref,
  getBestPackageOffer,
  getPackagePrimaryImage,
  getPackageShortDescription,
  getPackageShortTitle,
} from '@/lib/packages/presentation';
import type { CareerPackage } from '@/types/domain';

interface PackageCardProps {
  categoryLabel?: string;
  index: number;
  packageItem: CareerPackage;
  shortTitle?: string;
  rates?: SecondaryExchangeRates | null;
}

export function PackageCard({
  categoryLabel = 'Career service',
  index,
  packageItem,
  shortTitle: providedShortTitle,
  rates = null,
}: PackageCardProps) {
  const _copy = useCopy();

  const primaryImage = getPackagePrimaryImage(packageItem);
  const offer = getBestPackageOffer(packageItem);
  const shortTitle = providedShortTitle ?? getPackageShortTitle(packageItem);
  const shortDescription = getPackageShortDescription(packageItem);
  const shortDescriptionAr =
    packageItem.descriptionAr?.replace(/\s+/g, ' ').trim() ||
    'راجع المخرجات المشمولة وموعد التسليم والتعديلات.';
  const companionOffer = [...(packageItem.companionOffers ?? [])].sort(
    (first, second) => second.discountPercentage - first.discountPercentage,
  )[0];

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/90 shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-accent/70 hover:shadow-md focus-within:border-accent/70 focus-within:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
      <Link
        href={getPackageHref(packageItem)}
        aria-label={_copy(`View ${packageItem.name}`)}
        className="relative block aspect-[16/10] overflow-hidden border-b border-border/70 bg-surface-muted"
      >
        {primaryImage ? (
          <Image
            alt={_copy(
              primaryImage.altText ??
                `Professional presentation for ${packageItem.name}`,
            )}
            className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] motion-safe:group-hover:scale-[1.04] motion-reduce:transition-none"
            fill
            sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
            src={primaryImage.url ?? primaryImage.path}
          />
        ) : (
          <div
            aria-label={_copy('Career service document preview')}
            className="grid h-full place-items-center text-secondary"
            role="img"
          >
            <FileText
              aria-hidden="true"
              className="size-12"
              strokeWidth={1.25}
            />
          </div>
        )}
        {offer ? (
          <PackageOfferFlag
            className="absolute start-3 top-3 z-10"
            discountPercentage={offer.discountPercentage}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-accent"
        />
      </Link>

      <CardHeader className="gap-0">
        <div className="flex items-center justify-between gap-4">
          <Badge className="tracking-[0.06em] uppercase" variant="secondary">
            {_copy(categoryLabel)}
          </Badge>
          <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
            {_copy.number(index + 1, {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}
          </span>
        </div>

        <CardTitle
          as="h3"
          className="mt-5 text-primary transition-colors duration-200 group-hover:text-secondary"
        >
          <Link
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={getPackageHref(packageItem)}
          >
            {_copy(shortTitle, packageItem.nameAr)}
          </Link>
        </CardTitle>
        <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
          {_copy(shortDescription, shortDescriptionAr)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col border-t border-border/70 pt-5">
        <div className="mb-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-4" aria-hidden="true" />
            {_copy(packageItem.deliveryDays)} {_copy('days estimated')}
          </span>
        </div>
        <div className="mt-auto">
          <PackagePrice packageItem={packageItem} rates={rates} />
        </div>
        {companionOffer ? (
          <div className="mt-4 rounded-md border border-accent/35 bg-accent/10 p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-primary">
              <Sparkles aria-hidden="true" className="size-4 text-accent" />
              {_copy('Second-service offer', 'عرض على خدمة ثانية')}
            </p>
            <p className="mt-1.5 leading-6 text-foreground">
              {_copy('Buy this service and save', 'اشترِ هذه الخدمة ووفّر')}{' '}
              <strong>{_copy(companionOffer.discountPercentage)}%</strong>{' '}
              {_copy('on', 'على')}{' '}
              <strong>
                {companionOffer.type === 'cross_service_any'
                  ? _copy('any second service', 'أي خدمة ثانية')
                  : _copy(
                      companionOffer.packageName ??
                        'the selected second service',
                      companionOffer.packageNameAr,
                    )}
              </strong>
            </p>
          </div>
        ) : null}
        <PackageSocialProof
          className="mt-5 border-t border-border/70 pt-4"
          packageItem={packageItem}
        />
      </CardContent>

      <CardFooter className="mt-auto pt-3">
        <Button asChild className="group/button w-full" size="lg">
          <Link
            aria-label={_copy(`Explore ${packageItem.name}`)}
            href={getPackageHref(packageItem)}
          >
            {_copy('Explore service')}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 motion-safe:group-hover/button:translate-x-0.5 motion-safe:group-focus-visible/button:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
