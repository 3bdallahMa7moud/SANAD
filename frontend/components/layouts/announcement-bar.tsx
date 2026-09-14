'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgePercent, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

import { settingsApi, settingsKeys } from '@/lib/api';
import { useCopy } from '@/lib/i18n/use-copy';
import { cn } from '@/lib/utils/cn';

export interface AnnouncementBarProps {
  children?: ReactNode;
  className?: string;
}

const defaultBanner = {
  ar: 'خصم 50 درهم لأول 50 عميل',
  en: 'AED 50 off for the first 50 customers',
};

/** A public promotion controlled through the Admin > Settings screen. */
export function AnnouncementBar({ children, className }: AnnouncementBarProps) {
  const _copy = useCopy();
  const locale = useLocale();
  const settings = useQuery({
    queryKey: settingsKeys.public,
    queryFn: ({ signal }) => settingsApi.getPublic({ signal }),
    staleTime: 60_000,
  });
  const values = settings.data;
  const isEnabled = values?.banner_enabled !== 'false';
  const configuredText =
    locale === 'ar' ? values?.banner_text_ar : values?.banner_text_en;
  const content =
    children ??
    configuredText?.trim() ??
    defaultBanner[locale === 'ar' ? 'ar' : 'en'];
  const displayContent = _copy(content);

  if (!isEnabled || !content) return null;

  return (
    <aside
      aria-label={_copy('Announcement')}
      className={cn(
        'relative isolate overflow-hidden border-b border-accent/35 bg-primary text-primary-foreground shadow-sm',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_50%,rgb(184_149_90_/_0.32),transparent_27%),radial-gradient(circle_at_88%_0%,rgb(255_255_255_/_0.14),transparent_30%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-0 left-[14%] -z-10 h-px w-2/5 bg-gradient-to-r from-transparent via-accent/80 to-transparent"
      />

      <div className="layout-container flex min-h-[3.25rem] items-center gap-3 py-2 sm:gap-4">
        <span
          aria-hidden="true"
          className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 text-accent shadow-sm backdrop-blur-sm"
        >
          <BadgePercent className="size-4" strokeWidth={2.25} />
          <Sparkles className="absolute -top-1 -right-1 size-3 text-white" />
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden py-1.5">
          <p className="sr-only">{displayContent}</p>
          <div
            aria-hidden="true"
            className={
              'flex w-max animate-[sanad-announcement-marquee_18s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none'
            }
          >
            {[0, 1].map((group) => (
              <div
                className="flex shrink-0 items-center gap-8 pr-8 sm:gap-16 sm:pr-16"
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
                key={group}
              >
                {[0, 1, 2, 3].map((item) => (
                  <span
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-bold tracking-[0.01em] sm:text-base"
                    key={item}
                  >
                    <span className="size-1.5 rounded-full bg-accent shadow-[0_0_0_4px_rgb(184_149_90_/_0.16)]" />
                    <span>{displayContent}</span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.62rem] font-extrabold tracking-[0.12em] text-accent uppercase sm:text-[0.65rem]">
                      {_copy('Limited offer', 'عرض محدود')}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-primary to-transparent sm:w-14"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-primary to-transparent sm:w-14"
          />
        </div>
      </div>
    </aside>
  );
}
