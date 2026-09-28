import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';

import { WhatsAppFloatingButton } from './whatsapp-floating-button';

afterEach(cleanup);

function renderButton(locale: 'ar' | 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <WhatsAppFloatingButton />
    </NextIntlClientProvider>,
  );
}

function preparedMessage(link: HTMLElement): string | null {
  return new URL(
    link.getAttribute('href')!,
    window.location.origin,
  ).searchParams.get('text');
}

describe('WhatsAppFloatingButton', () => {
  it('prepares an English message for the English interface', () => {
    renderButton('en');

    const link = screen.getByRole('link', { name: 'Chat with us now' });
    expect(preparedMessage(link)).toBe(
      'Hello, I would like to ask about SANAD career services.',
    );
  });

  it('prepares an Arabic message for the Arabic interface', () => {
    renderButton('ar');

    const link = screen.getByRole('link', { name: 'تواصل معنا الآن' });
    expect(preparedMessage(link)).toBe(
      'مرحبًا، أود الاستفسار عن خدمات سند المهنية.',
    );
  });
});
