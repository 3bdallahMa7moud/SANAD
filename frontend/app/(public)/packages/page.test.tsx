import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PackagesPage from './page';
import { NextIntlClientProvider } from 'next-intl';
vi.mock('next-intl/server', () => ({ getLocale: async () => 'en' }));
vi.mock('@/lib/packages/exchange-rates', () => ({
  getSecondaryExchangeRates: async () => null,
}));
vi.mock('@/lib/api/public-settings-server', () => ({
  getInitialPublicSettings: async () => ({}),
}));

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/lib/api', () => ({
  packagesApi: { list },
}));
vi.mock('@/components/packages/services-catalog', () => ({
  ServicesCatalog: ({ packages }: { packages: unknown[] }) => (
    <div>Available services: {packages.length}</div>
  ),
}));
vi.mock('@/components/packages/package-comparison', () => ({
  PackageComparison: () => null,
}));

describe('Public catalog availability', () => {
  it('preserves an empty catalog instead of inventing purchasable packages', async () => {
    list.mockResolvedValueOnce({ items: [] });
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={{}}>
        {await PackagesPage()}
      </NextIntlClientProvider>,
    );
    expect(html).toContain('Available services: 0');
    expect(html).not.toContain('Premium Full Package');
  });

  it('passes an outage to the route error boundary instead of displaying static prices', async () => {
    const error = new Error('API unavailable');
    list.mockRejectedValueOnce(error);
    await expect(PackagesPage()).rejects.toBe(error);
  });
});
