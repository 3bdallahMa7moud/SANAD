import { getCopy } from '@/lib/i18n/server-copy';
import type { ReactNode } from 'react';

import { PublicLayout } from '@/components/layouts/public-layout';
import { getInitialPublicSettings } from '@/lib/api/public-settings-server';

export default async function PublicRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [_copy, initialSettings] = await Promise.all([
    getCopy(),
    getInitialPublicSettings(),
  ]);

  return (
    <PublicLayout initialSettings={initialSettings}>
      {_copy(children)}
    </PublicLayout>
  );
}
