'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';

import { persistLocale } from '@/app/actions/locale';

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
  const [isPending, beginLocaleTransition] = useTransition();
  const localeRequestInFlight = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.lang = initialLocale;
    document.documentElement.dir = initialLocale === 'ar' ? 'rtl' : 'ltr';
  }, [initialLocale]);

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (
        nextLocale === initialLocale ||
        isPending ||
        localeRequestInFlight.current
      ) {
        return;
      }

      localeRequestInFlight.current = true;

      // Do not update only the client locale while the old Server Component
      // payload is still on screen. The action changes the cookie and Next.js
      // returns the new route/layout tree together, so every section switches
      // in one coherent commit.
      beginLocaleTransition(async () => {
        try {
          await persistLocale(nextLocale);
        } catch (error) {
          // A stale Server Action reference after a deployment or a temporary
          // network failure should leave the current page usable and retryable.
          console.error('Unable to change the interface language.', error);
        } finally {
          localeRequestInFlight.current = false;
        }
      });
    },
    [beginLocaleTransition, initialLocale, isPending],
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
