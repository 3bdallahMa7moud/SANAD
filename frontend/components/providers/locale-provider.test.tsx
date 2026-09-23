import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useLocale } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocaleProvider, useLocaleSwitcher } from './locale-provider';

const mocks = vi.hoisted(() => ({
  persistLocale: vi.fn(),
}));

vi.mock('@/app/actions/locale', () => ({
  persistLocale: mocks.persistLocale,
}));

const headingCopy = {
  ar: 'ابنِ ملفاً مهنياً',
  en: 'Build a Career Profile',
} as const;

function LocaleControl({ target }: { target: 'ar' | 'en' }) {
  const locale = useLocale();
  const { isPending, setLocale } = useLocaleSwitcher();

  return (
    <button disabled={isPending} onClick={() => setLocale(target)}>
      {locale}
    </button>
  );
}

function TestProvider({
  locale,
  target,
}: {
  locale: 'ar' | 'en';
  target: 'ar' | 'en';
}) {
  return (
    <LocaleProvider
      initialLocale={locale}
      messagesByLocale={{ ar: {}, en: {} }}
    >
      <LocaleControl target={target} />
      <h1>{headingCopy[locale]}</h1>
    </LocaleProvider>
  );
}

describe('LocaleProvider', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  beforeEach(() => {
    mocks.persistLocale.mockReset();
  });

  it('keeps the old page coherent until the server sends the new locale tree', async () => {
    let finishLocaleUpdate: (() => void) | undefined;
    mocks.persistLocale.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishLocaleUpdate = resolve;
        }),
    );
    const view = render(<TestProvider locale="en" target="ar" />);

    fireEvent.click(screen.getByRole('button', { name: 'en' }));

    await waitFor(() => expect(mocks.persistLocale).toHaveBeenCalledWith('ar'));

    // Server and client copy must remain from the same locale while the
    // Server Action/RSC response is in flight.
    expect(screen.getByRole('button', { name: 'en' })).toBeVisible();
    expect(screen.getByRole('heading')).toHaveTextContent(headingCopy.en);
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    // Simulate the route/layout tree returned after the cookie mutation.
    view.rerender(<TestProvider locale="ar" target="en" />);
    expect(screen.getByRole('button', { name: 'ar' })).toBeVisible();
    expect(screen.getByRole('heading')).toHaveTextContent(headingCopy.ar);
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    await act(async () => finishLocaleUpdate?.());
  });

  it('does not persist when the selected locale is already active', () => {
    render(<TestProvider locale="ar" target="ar" />);

    fireEvent.click(screen.getByRole('button', { name: 'ar' }));

    expect(mocks.persistLocale).not.toHaveBeenCalled();
  });

  it('keeps the current locale usable when the server action fails', async () => {
    const error = new Error('network unavailable');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mocks.persistLocale.mockRejectedValue(error);
    render(<TestProvider locale="en" target="ar" />);

    fireEvent.click(screen.getByRole('button', { name: 'en' }));

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'Unable to change the interface language.',
        error,
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'en' })).toBeEnabled(),
    );
    expect(screen.getByRole('heading')).toHaveTextContent(headingCopy.en);
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    consoleError.mockRestore();
  });
});
