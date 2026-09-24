import { describe, expect, it } from 'vitest';

import {
  getOrganizationStructuredData,
  serializeJsonLd,
} from './structured-data';

describe('organization structured data', () => {
  it('uses the canonical site URL and recognized SANAD spellings', () => {
    const data = getOrganizationStructuredData({
      locale: 'en',
      siteUrl: 'https://sanadcv.com',
    });
    const graph = data['@graph'] as Array<Record<string, unknown>>;
    const organization = graph.find((item) => item['@type'] === 'Organization');

    expect(organization).toMatchObject({
      name: 'SANAD',
      alternateName: expect.arrayContaining(['Sanad CV', 'Saanad']),
      url: 'https://sanadcv.com',
      logo: 'https://sanadcv.com/brand/sanad-logo.webp',
    });
  });

  it('escapes markup before emitting JSON-LD', () => {
    expect(serializeJsonLd({ name: '<script>' })).toContain('\\u003cscript>');
  });
});
