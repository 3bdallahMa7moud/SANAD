'use client';

import {
  ArrowRight,
  FileCheck2,
  LayoutTemplate,
  UserRoundCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  MotionAccentLine,
  MotionHeading,
  MotionReveal,
  MotionStaggerItem,
} from '@/components/motion/motion-reveal';
import { PackagePrice } from '@/components/packages/package-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCopy } from '@/lib/i18n/use-copy';
import type { SecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import {
  getPackageHref,
  getPackagePrimaryImage,
} from '@/lib/packages/presentation';
const careerExcellencePackageImage =
  '/images/packages/career-excellence-package.webp';
const goldenSignaturePackageImage =
  '/images/packages/golden-signature-package.webp';
const linkedInProfileImage =
  '/images/packages/linkedin-profile-optimization.webp';
const professionalPackageImage =
  '/images/packages/professional-distinction-package.webp';
import type { CareerPackage } from '@/types/domain';

const packageIcons = {
  file: FileCheck2,
  layout: LayoutTemplate,
  user: UserRoundCheck,
} as const;

function getFeaturedServiceImage(packageName: string) {
  switch (packageName) {
    case 'Premium Full Package':
    case 'Premium Bilingual Package':
    case 'Golden Signature Package':
    case 'Complete Package':
      return goldenSignaturePackageImage;
    case 'Full Package':
    case 'Professional Package':
    case 'Career Excellence Package':
    case 'Advanced Package':
    case 'Professional Distinction Package':
    case 'Basic Package':
      return careerExcellencePackageImage;
    case 'LinkedIn Profile Optimization':
      return linkedInProfileImage;
    default:
      return professionalPackageImage;
  }
}

export function FeaturedPackagesIntro() {
  const t = useTranslations('home.featuredPackages');

  return (
    <div className="grid gap-6 border-b border-border pb-10 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:items-end md:gap-12 lg:pb-12">
      <div>
        <MotionReveal direction="none">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            <MotionAccentLine className="h-px w-8 origin-left bg-accent" />
            {t('eyebrow')}
          </p>
        </MotionReveal>
        <MotionHeading
          className="type-h2 mt-5 max-w-[17ch]"
          id="featured-packages-heading"
          text={t('heading')}
        />
      </div>

      <MotionReveal
        className="md:justify-self-end"
        delay={0.12}
        direction="right"
      >
        <p className="max-w-[34rem] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
          {t('body')}
        </p>
      </MotionReveal>
    </div>
  );
}

interface FeaturedPackageCardProps {
  categoryKey: string;
  description?: string;
  descriptionAr?: string;
  displayName?: string;
  displayNameAr?: string;
  icon: keyof typeof packageIcons;
  packageItem: CareerPackage;
  rates: SecondaryExchangeRates | null;
}

export function FeaturedPackageCard({
  categoryKey,
  description,
  descriptionAr,
  displayName,
  displayNameAr,
  icon,
  packageItem,
  rates,
}: FeaturedPackageCardProps) {
  const _copy = useCopy();
  const t = useTranslations('home.featuredPackages');
  const Icon = packageIcons[icon];
  // Keep the home page aligned with the catalog: an image uploaded by an
  // administrator is always preferred. The packaged image only fills the
  // gap for older services that do not have an uploaded image yet.
  const primaryImage = getPackagePrimaryImage(packageItem);
  const serviceImage =
    primaryImage?.url ??
    primaryImage?.path ??
    getFeaturedServiceImage(packageItem.name);
  const serviceName = _copy(
    displayName ?? packageItem.name,
    displayNameAr ?? packageItem.nameAr,
  );
  const serviceImageAlt = _copy(primaryImage?.altText ?? serviceName);

  return (
    <MotionStaggerItem
      className="md:last:col-span-2 md:last:mx-auto md:last:w-[calc(50%-0.625rem)] lg:last:col-span-1 lg:last:mx-0 lg:last:w-auto"
      hoverLift
    >
      <Card className="group relative flex h-full flex-col overflow-hidden border-t-2 border-t-accent shadow-xs transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-md focus-within:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 ease-[var(--ease-standard)] motion-safe:group-hover:scale-x-100 motion-safe:group-focus-within:scale-x-100 motion-reduce:transition-none"
        />
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface-muted">
          <Image
            alt={serviceImageAlt}
            className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-within:scale-[1.035] motion-reduce:transition-none"
            fill
            placeholder="empty"
            sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), 28rem"
            src={serviceImage}
          />
        </div>
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between gap-4">
            <Badge className="tracking-[0.08em] uppercase" variant="secondary">
              {t(categoryKey)}
            </Badge>
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-muted text-secondary transition-transform duration-300 ease-[var(--ease-standard)] motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:rotate-3 motion-reduce:transition-none">
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.7} />
            </span>
          </div>

          <CardTitle className="mt-5 text-primary text-xl font-bold">
            {serviceName}
          </CardTitle>
          <CardDescription className="mt-3 text-sm leading-6 text-muted-foreground">
            {_copy(
              description ??
                packageItem.description ??
                'A focused professional service tailored to your career goals.',
              descriptionAr ?? packageItem.descriptionAr,
            )}
          </CardDescription>
          <PackagePrice
            className="mt-5"
            packageItem={packageItem}
            rates={rates}
          />
        </CardHeader>

        <CardFooter className="mt-auto pt-4 border-t border-border/60">
          <Button
            asChild
            className="group/btn w-full justify-between"
            variant="ghost"
          >
            <Link href={getPackageHref(packageItem)}>
              <span className="font-semibold text-primary group-hover/btn:text-accent-foreground">
                {t('exploreService')}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 rtl:rotate-180 transition-transform duration-200 motion-safe:group-hover/btn:translate-x-1 rtl:motion-safe:group-hover/btn:-translate-x-1"
              />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </MotionStaggerItem>
  );
}
