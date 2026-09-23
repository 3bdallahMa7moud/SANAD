'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  MotionAccentLine,
  MotionHeading,
  MotionReveal,
} from '@/components/motion/motion-reveal';
import { Button } from '@/components/ui/button';
import type { PackageReview } from '@/types/domain';

import { TestimonialsCarousel } from './testimonials-carousel';

export function TestimonialsContent({ reviews }: { reviews: PackageReview[] }) {
  const t = useTranslations('home.testimonials');

  if (reviews.length === 0) return null;

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
                {t('eyebrow')}
              </p>
            </MotionReveal>
            <MotionHeading
              className="type-h2 mt-4"
              id="testimonials-heading"
              text={t('heading')}
            />
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {t('body')}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/feedback">{t('viewAll')}</Link>
          </Button>
        </div>

        <TestimonialsCarousel reviews={reviews} />
      </div>
    </section>
  );
}
