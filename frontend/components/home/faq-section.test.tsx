import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import englishMessages from '@/messages/en.json';

import { FaqSection } from './faq-section';

describe('Job Application Service FAQ', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    cleanup();
  });

  it('describes direct email outreach without platform verification copy', () => {
    render(
      <NextIntlClientProvider locale="en" messages={englishMessages}>
        <FaqSection />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText(
        'SANAD identifies suitable companies and job opportunities based on your experience, then sends your CV with a professional English application email to up to 60 suitable companies using your email account.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'What happens if an application platform requires verification?',
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/OTP verification/i)).not.toBeInTheDocument();
  });

  it('uses the Premium Full Package name in both the question and answer', () => {
    render(
      <NextIntlClientProvider locale="en" messages={englishMessages}>
        <FaqSection />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText(
        'Does the Premium Full Package include job applications?',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No\. The Premium Full Package includes/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Premium Bilingual Package/),
    ).not.toBeInTheDocument();
  });
});
