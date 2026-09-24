import type { MetadataRoute } from 'next';

import { packagesApi } from '@/lib/api';
import { getSiteUrl } from '@/lib/env/public-env';
import { getPackageHref } from '@/lib/packages/presentation';

const publicRoutes = [
  '/',
  '/packages',
  '/faq',
  '/feedback',
  '/pages/about-us',
  '/pages/privacy-policy',
  '/pages/terms-and-conditions',
] as const;

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : path === '/packages' ? 0.9 : 0.6,
  }));

  try {
    const { items } = await packagesApi.list({ limit: 100 });
    const packageEntries: MetadataRoute.Sitemap = items.map((packageItem) => ({
      url: new URL(getPackageHref(packageItem), siteUrl).toString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticEntries, ...packageEntries];
  } catch {
    // A temporary API failure must not make robots.txt point to a broken
    // sitemap. Static public pages remain discoverable and the next crawl can
    // pick up package URLs once the API is available again.
    return staticEntries;
  }
}
