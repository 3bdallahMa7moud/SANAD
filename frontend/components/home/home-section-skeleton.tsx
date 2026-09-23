'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useCopy } from '@/lib/i18n/use-copy';
import { cn } from '@/lib/utils/cn';

interface HomeSectionSkeletonProps {
  section: 'packages' | 'testimonials';
}

/** Keeps streamed home sections present and announced while their data loads. */
export function HomeSectionSkeleton({ section }: HomeSectionSkeletonProps) {
  const _copy = useCopy();
  const isPackages = section === 'packages';
  const label = isPackages
    ? _copy('Loading featured services...', 'جارٍ تحميل الخدمات المميزة...')
    : _copy('Loading client feedback...', 'جارٍ تحميل آراء العملاء...');

  return (
    <section
      aria-busy="true"
      aria-label={label}
      className={cn(
        'scroll-mt-24 border-b border-border',
        isPackages ? 'bg-background' : 'bg-surface-muted',
      )}
      id={isPackages ? 'services' : 'reviews'}
      role="status"
    >
      <div className="layout-container layout-section">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div
          aria-hidden="true"
          className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className={cn(
                'rounded-xl border border-border bg-surface p-6 shadow-xs',
                isPackages ? 'min-h-64' : 'min-h-48',
              )}
              key={index}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-6 h-7 w-3/4" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-8 h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
