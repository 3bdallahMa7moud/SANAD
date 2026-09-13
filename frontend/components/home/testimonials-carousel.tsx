'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

import { VerifiedReviewCard } from '@/components/feedback/verified-review-card';
import { useCopy } from '@/lib/i18n/use-copy';
import type { PackageReview } from '@/types/domain';

export function TestimonialsCarousel({
  reviews,
}: {
  reviews: PackageReview[];
}) {
  const _copy = useCopy();
  const [paused, setPaused] = useState(false);
  const canMove = reviews.length > 1;

  return (
    <div className="mt-9 sm:mt-10">
      {canMove ? (
        <div className="reviews-loop-control mb-4 flex justify-end">
          <button
            aria-label={
              paused
                ? _copy('Play review animation', 'تشغيل حركة التقييمات')
                : _copy('Pause review animation', 'إيقاف حركة التقييمات')
            }
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-accent hover:bg-accent/10"
            onClick={() => setPaused((value) => !value)}
            type="button"
          >
            {paused ? (
              <Play aria-hidden="true" className="size-4" />
            ) : (
              <Pause aria-hidden="true" className="size-4" />
            )}
            {paused ? _copy('Play', 'تشغيل') : _copy('Pause', 'إيقاف')}
          </button>
        </div>
      ) : null}
      <div
        className="reviews-loop"
        data-count={reviews.length}
        data-paused={paused || !canMove}
      >
        <div className="reviews-loop-track">
          <ul className="reviews-loop-group">
            {reviews.map((review) => (
              <li className="reviews-loop-card" key={review.id}>
                <VerifiedReviewCard review={review} />
              </li>
            ))}
          </ul>
          {canMove ? (
            <ul
              aria-hidden="true"
              className="reviews-loop-group reviews-loop-copy"
              inert
            >
              {reviews.map((review) => (
                <li className="reviews-loop-card" key={review.id}>
                  <VerifiedReviewCard review={review} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
