'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { settingsApi, settingsKeys, type PublicSettings } from '@/lib/api';
import { useCopy } from '@/lib/i18n/use-copy';
import { cn } from '@/lib/utils/cn';

export interface AnnouncementBarProps {
  children?: ReactNode;
  className?: string;
  initialSettings?: PublicSettings | null;
}

/** A public promotion controlled through the Admin > Settings screen. */
export function AnnouncementBar({
  children,
  className,
  initialSettings = null,
}: AnnouncementBarProps) {
  const _copy = useCopy();
  const locale = useLocale();
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLSpanElement>(null);
  const [repeatCount, setRepeatCount] = useState(12);
  const settings = useQuery({
    queryKey: settingsKeys.public,
    queryFn: ({ signal }) => settingsApi.getPublic({ signal }),
    staleTime: 60_000,
    initialData: initialSettings ?? undefined,
  });
  const values = settings.data ?? initialSettings;
  const hasCustomContent = children !== undefined && children !== null;
  const isEnabled = hasCustomContent
    ? values?.banner_enabled !== 'false'
    : values !== null &&
      values !== undefined &&
      values.banner_enabled !== 'false';
  const configuredText =
    locale === 'ar' ? values?.banner_text_ar : values?.banner_text_en;
  const content = children ?? configuredText?.trim() ?? null;
  const displayContent = _copy(content);

  useEffect(() => {
    const viewport = viewportRef.current;
    const item = itemRef.current;
    if (!isEnabled || !viewport || !item) return;

    const updateRepeatCount = () => {
      const itemWidth = item.getBoundingClientRect().width;
      if (itemWidth > 0) {
        setRepeatCount(
          Math.max(12, Math.ceil(viewport.clientWidth / itemWidth) + 1),
        );
      }
    };

    const observer = new ResizeObserver(updateRepeatCount);
    observer.observe(viewport);
    observer.observe(item);
    updateRepeatCount();
    return () => observer.disconnect();
  }, [displayContent, isEnabled]);

  if (!isEnabled || !content) return null;

  return (
    <aside
      aria-label={_copy('Announcement')}
      className={cn(
        'border-b border-[#b8955a]/40 bg-[#12395a] text-white',
        className,
      )}
    >
      <p className="sr-only">{displayContent}</p>
      <div
        aria-hidden="true"
        className="overflow-hidden"
        dir="ltr"
        ref={viewportRef}
      >
        <div
          className="flex w-max animate-[sanad-announcement-marquee_72s_linear_infinite] will-change-transform motion-reduce:animate-none"
          dir="ltr"
        >
          {[0, 1].map((group) => (
            <div
              className="flex min-h-10 w-max shrink-0 items-center"
              key={group}
            >
              {Array.from({ length: repeatCount }, (_, item) => (
                <span
                  className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap px-5 py-2 text-xs font-bold leading-5 sm:text-[13px]"
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  key={item}
                  ref={group === 0 && item === 0 ? itemRef : undefined}
                >
                  <span className="text-[11px] text-[#dfbe83]">◆</span>
                  <span>{displayContent}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
