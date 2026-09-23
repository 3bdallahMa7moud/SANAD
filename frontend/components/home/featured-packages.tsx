import { getCopy } from '@/lib/i18n/server-copy';
import { getTranslations } from 'next-intl/server';

import { PackageCard } from '@/components/packages/package-card';
import {
  MotionAccentLine,
  MotionHeading,
  MotionReveal,
  MotionStaggerItem,
  MotionStaggerList,
} from '@/components/motion/motion-reveal';
import { packagesApi } from '@/lib/api';
import { getSecondaryExchangeRates } from '@/lib/packages/exchange-rates';
import { getServiceCategoryLabel } from '@/lib/packages/categories';
import type { CareerPackage } from '@/types/domain';

function selectFeaturedPackages(catalog: CareerPackage[]): CareerPackage[] {
  return [...catalog]
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .slice(0, 3);
}

export async function FeaturedPackages() {
  const _copy = await getCopy();
  const t = await getTranslations('home.featuredPackages');

  const [catalog, rates] = await Promise.all([
    packagesApi.list({ limit: 100 }),
    getSecondaryExchangeRates(),
  ]);
  const featuredPackages = selectFeaturedPackages(catalog.items);

  return (
    <section
      aria-labelledby="featured-packages-heading"
      className="scroll-mt-24 border-b border-border bg-background"
      dir={_copy.locale === 'ar' ? 'rtl' : 'ltr'}
      id="services"
    >
      <div className="layout-container layout-section">
        <div className="grid gap-6 border-b border-border pb-10 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:items-end md:gap-12 lg:pb-12">
          <div>
            <MotionReveal direction="none">
              <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
                <MotionAccentLine className="h-px w-8 origin-left bg-accent" />
                {_copy(t('eyebrow'))}
              </p>
            </MotionReveal>
            <MotionHeading
              className="type-h2 mt-5 max-w-[17ch]"
              id="featured-packages-heading"
              text={_copy(t('heading'))}
            />
          </div>

          <MotionReveal
            className="md:justify-self-end"
            delay={0.12}
            direction="right"
          >
            <p className="max-w-[34rem] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              {_copy(t('body'))}
            </p>
          </MotionReveal>
        </div>

        <MotionStaggerList className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
          {featuredPackages.map((packageItem, index) => (
            <MotionStaggerItem hoverLift key={packageItem.id}>
              <PackageCard
                categoryLabel={getServiceCategoryLabel(packageItem)}
                index={index}
                packageItem={packageItem}
                rates={rates}
              />
            </MotionStaggerItem>
          ))}
        </MotionStaggerList>
      </div>
    </section>
  );
}
