import { getLocalizedMetadata } from '@/lib/i18n/metadata';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PublicLayout } from '@/components/layouts/public-layout';
import { AccountGuard } from '@/components/account/account-guard';
import { getInitialPublicSettings } from '@/lib/api/public-settings-server';

const pageMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialSettings = await getInitialPublicSettings();

  return (
    <PublicLayout initialSettings={initialSettings}>
      <AccountGuard>{children}</AccountGuard>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return getLocalizedMetadata(pageMetadata);
}
