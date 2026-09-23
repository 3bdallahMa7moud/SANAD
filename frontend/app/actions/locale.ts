'use server';

import { cookies } from 'next/headers';

const supportedLocales = new Set(['ar', 'en']);

/**
 * Persists the locale on the server. Mutating a cookie in a Server Action
 * makes Next.js re-render the active route and its layouts from one locale
 * source of truth.
 */
export async function persistLocale(locale: string): Promise<void> {
  if (!supportedLocales.has(locale)) {
    throw new Error('Unsupported locale');
  }

  const cookieStore = await cookies();
  cookieStore.set('SANAD_LOCALE', locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
