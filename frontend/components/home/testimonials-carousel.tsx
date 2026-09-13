'use client';

import { VerifiedReviewCard } from '@/components/feedback/verified-review-card';
import { useCopy } from '@/lib/i18n/use-copy';
import type { PackageReview } from '@/types/domain';

export function TestimonialsCarousel({
  reviews,
}: {
  reviews: PackageReview[];
}) {
  const _copy = useCopy();
  const canLoop = reviews.length > 1;

  return (
    <div className="mt-9 sm:mt-10">
      <div
        aria-label={_copy('Customer reviews', 'تقييمات العملاء')}
        className="reviews-loop"
        data-count={reviews.length}
        role="group"
        tabIndex={0}
      >
        <div className="reviews-loop-track">
          <ul className="reviews-loop-group">
            {reviews.map((review) => (
              <li className="reviews-loop-card" key={review.id}>
                <VerifiedReviewCard review={review} />
              </li>
            ))}
          </ul>
          {canLoop ? (
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
