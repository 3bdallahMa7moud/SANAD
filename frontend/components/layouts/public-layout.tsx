import { useCopy } from '@/lib/i18n/use-copy';
import type { ReactNode } from 'react';

import { AnnouncementBar } from '@/components/layouts/announcement-bar';
import { PublicFooter } from '@/components/layouts/public-footer';
import { PublicNavbar } from '@/components/layouts/public-navbar';
import { ScrollToTopButton } from '@/components/shared/scroll-to-top-button';
import type { PublicSettings } from '@/lib/api';

export interface PublicLayoutProps {
  announcement?: ReactNode;
  children: ReactNode;
  initialSettings?: PublicSettings | null;
}

export function PublicLayout({
  announcement,
  children,
  initialSettings = null,
}: PublicLayoutProps) {
  const _copy = useCopy();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <a
        className="sr-only z-[60] rounded-md bg-surface px-4 py-3 font-semibold text-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#main-content"
      >
        {_copy('Skip to main content')}
      </a>
      <div className="sticky top-0 z-40">
        <AnnouncementBar initialSettings={initialSettings}>
          {announcement ? _copy(announcement) : undefined}
        </AnnouncementBar>
        <PublicNavbar />
      </div>
      <main className="min-w-0 flex-1" id="main-content" tabIndex={-1}>
        {_copy(children)}
      </main>
      <PublicFooter initialSettings={initialSettings} />
      <ScrollToTopButton />
    </div>
  );
}
