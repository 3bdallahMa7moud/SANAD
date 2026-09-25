import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnnouncementBar } from './announcement-bar';
import { PublicSocialLinks } from './public-social-links';

const mocks = vi.hoisted(() => ({ getPublic: vi.fn() }));

vi.mock('@/lib/api', () => ({
  settingsApi: { getPublic: mocks.getPublic },
  settingsKeys: { public: ['settings', 'public'] as const },
}));

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <NextIntlClientProvider locale="en" messages={{}}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe('public settings on the first render', () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.getPublic.mockReset();
    mocks.getPublic.mockImplementation(() => new Promise(() => undefined));
  });

  it('renders the current promotional text immediately without the old fallback', () => {
    renderWithProviders(
      <AnnouncementBar
        initialSettings={{
          banner_enabled: 'true',
          banner_text_en: '35% off for a limited time — explore the offers now',
        }}
      />,
    );

    expect(screen.getByLabelText('Announcement')).toHaveTextContent(
      '35% off for a limited time',
    );
    expect(screen.queryByText(/50% off selected packages/i)).toBeNull();
    expect(mocks.getPublic).not.toHaveBeenCalled();
  });

  it('does not render a disabled promotional banner', () => {
    renderWithProviders(
      <AnnouncementBar
        initialSettings={{
          banner_enabled: 'false',
          banner_text_en: 'A disabled promotion',
        }}
      />,
    );

    expect(screen.queryByLabelText('Announcement')).toBeNull();
  });

  it('renders only configured contact links on the first render', () => {
    renderWithProviders(
      <PublicSocialLinks
        initialSettings={{
          instagram_url: 'https://instagram.com/sanad-current',
          facebook_url: null,
          linkedin_url: null,
          support_email: null,
          whatsapp_number: null,
        }}
      />,
    );

    expect(screen.getByLabelText('Follow us on Instagram')).toHaveAttribute(
      'href',
      'https://instagram.com/sanad-current',
    );
    expect(screen.queryByLabelText('Follow us on Facebook')).toBeNull();
    expect(screen.queryByLabelText('Follow us on LinkedIn')).toBeNull();
    expect(mocks.getPublic).not.toHaveBeenCalled();
  });

  it('shows no stale defaults while settings are unavailable', () => {
    const { container } = renderWithProviders(
      <>
        <AnnouncementBar />
        <PublicSocialLinks />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(container).not.toHaveTextContent('50%');
  });
});
