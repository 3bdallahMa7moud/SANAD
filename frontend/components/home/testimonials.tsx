import { getCopy } from '@/lib/i18n/server-copy';
import {
  MotionAccentLine,
  MotionHeading,
  MotionReveal,
} from '@/components/motion/motion-reveal';
import { Button } from '@/components/ui/button';
import { reviewsApi } from '@/lib/api';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { TestimonialsCarousel } from './testimonials-carousel';

export async function Testimonials() {
  const _copy = await getCopy();

  const t = await getTranslations('home.testimonials');
  const featured = await reviewsApi.listFeatured().catch(() => null);
  const visibleReviews = featured?.items ?? [];

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="scroll-mt-24 border-b border-border bg-surface-muted"
      id="reviews"
    >
      <div className="layout-container py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <MotionReveal direction="none">
              <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
                <MotionAccentLine className="h-px w-8 origin-left bg-accent" />
                {_copy(t('eyebrow'))}
              </p>
            </MotionReveal>
            <MotionHeading
              className="type-h2 mt-4"
              id="testimonials-heading"
              text={_copy(t('heading'))}
            />
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {_copy(t('body'))}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/feedback">{_copy(t('viewAll'))}</Link>
          </Button>
        </div>

        {visibleReviews.length > 0 ? (
          <TestimonialsCarousel reviews={visibleReviews} />
        ) : (
          <p className="mt-8 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-sm leading-7 text-muted-foreground">
            {_copy(t('noFeedback'))}
          </p>
        )}
      </div>
    </section>
  );
}
