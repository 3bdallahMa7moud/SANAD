import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useLocale } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocaleProvider, useLocaleSwitcher } from './locale-provider';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

function LocaleControl() {
  const locale = useLocale();
  const { setLocale } = useLocaleSwitcher();

  return <button onClick={() => setLocale('ar')}>{locale}</button>;
}

function TestProvider({ locale }: { locale: 'ar' | 'en' }) {
  return (
    <LocaleProvider
      initialLocale={locale}
      messagesByLocale={{ ar: {}, en: {} }}
    >
      <LocaleControl />
    </LocaleProvider>
  );
}

describe('LocaleProvider', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mocks.refresh.mockReset();
    document.cookie = 'SANAD_LOCALE=; Max-Age=0; path=/';
  });

  it('persists the requested locale and refreshes the route in place', () => {
    const view = render(<TestProvider locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'en' }));

    expect(document.cookie).toContain('SANAD_LOCALE=ar');
    expect(mocks.refresh).toHaveBeenCalledOnce();

    view.rerender(<TestProvider locale="ar" />);
    expect(screen.getByRole('button', { name: 'ar' })).toBeVisible();
  });

  it('does not refresh when the selected locale is already active', () => {
    render(<TestProvider locale="ar" />);

    fireEvent.click(screen.getByRole('button', { name: 'ar' }));

    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
