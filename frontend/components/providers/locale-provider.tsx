'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useRouter } from 'next/navigation';

export type AppLocale = 'ar' | 'en';

interface LocaleContextValue {
  isPending: boolean;
  setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale: AppLocale;
  messagesByLocale: Record<AppLocale, AbstractIntlMessages>;
}

/** Keeps client and server-rendered copy in sync when the locale changes. */
export function LocaleProvider({
  children,
  initialLocale,
  messagesByLocale,
}: LocaleProviderProps) {
  const router = useRouter();
  const [isPending, beginLocaleTransition] = useTransition();

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === initialLocale || isPending) return;

      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `SANAD_LOCALE=${nextLocale}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

      // Keep the current page intact while React fetches and atomically merges
      // the Server Component payload for the new locale. This preserves client
      // state and avoids a full document reload and a second hydration pass.
      beginLocaleTransition(() => {
        router.refresh();
      });
    },
    [beginLocaleTransition, initialLocale, isPending, router],
  );

  const value = useMemo(
    () => ({ isPending, setLocale }),
    [isPending, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={initialLocale}
        messages={messagesByLocale[initialLocale]}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleSwitcher() {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error('useLocaleSwitcher must be used inside LocaleProvider');
  return context;
}
