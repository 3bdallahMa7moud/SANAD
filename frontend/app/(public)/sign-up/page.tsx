import { Suspense } from 'react';
import type { Metadata } from 'next';

import { SignUpFlow } from '@/components/auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SignUpRoute() {
  return (
    <main className="section-shell py-12 sm:py-20">
      <div className="mx-auto max-w-[34rem] rounded-[20px] border border-border/70 bg-surface p-6 shadow-xl shadow-primary/10 sm:p-9">
        <Suspense>
          <SignUpFlow />
        </Suspense>
      </div>
    </main>
  );
}
