import { useCopy } from '@/lib/i18n/use-copy';
import { Quote } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StarRating } from './star-rating';
import type { PackageReview } from '@/types/domain';

export function VerifiedReviewCard({ review }: { review: PackageReview }) {
  const _copy = useCopy();

  const name =
    review.customerDisplayName?.trim() ||
    review.customerName?.trim() ||
    _copy('SANAD Customer');
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <Card className="flex h-full flex-col rounded-xl border-border/80 bg-surface shadow-sm">
      <CardHeader className="gap-5 border-b border-border/70 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              {initials}
            </span>
            <p className="min-w-0 break-words text-base font-semibold leading-6 text-primary">
              {name}
            </p>
          </div>
          <Quote
            aria-hidden="true"
            className="size-6 shrink-0 text-accent/70"
          />
        </div>
        <StarRating rating={review.rating} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-5">
        <p className="flex-1 text-base leading-7 text-foreground">
          {review.comment}
        </p>
        {review.packageName ? (
          <p className="mt-6 border-t border-border/70 pt-4 text-xs font-semibold text-secondary">
            {_copy(review.packageName, review.packageNameAr)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
