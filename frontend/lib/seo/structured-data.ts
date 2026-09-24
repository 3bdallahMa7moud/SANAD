type StructuredData = Record<string, unknown>;

const SUPPORT_EMAIL = 'saanadcv@gmail.com';
const BRAND_ALTERNATE_NAMES = ['Sanad CV', 'Saanad', 'Saanad CV', 'سند'];

export function serializeJsonLd(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Declares the brand once for every public page so crawlers can associate the
 * name, the former Saanad spelling, and the canonical domain with one entity.
 */
export function getOrganizationStructuredData({
  locale,
  siteUrl,
}: {
  locale: string;
  siteUrl: string;
}): StructuredData {
  const organizationId = `${siteUrl}/#organization`;
  const isArabic = locale === 'ar';
  const description = isArabic
    ? 'سند تقدم خدمات احترافية للسيرة الذاتية وملف لينكدإن والمستندات المهنية لسوق العمل في الإمارات والخليج.'
    : 'SANAD provides professional CV, LinkedIn, and career-document services for the UAE and Gulf job market.';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'SANAD',
        alternateName: BRAND_ALTERNATE_NAMES,
        url: siteUrl,
        logo: new URL('/brand/sanad-logo.webp', siteUrl).toString(),
        email: SUPPORT_EMAIL,
        description,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: SUPPORT_EMAIL,
          availableLanguage: ['Arabic', 'English'],
        },
        areaServed: [
          'United Arab Emirates',
          'Saudi Arabia',
          'Gulf Cooperation Council',
        ],
        knowsAbout: [
          'Professional CV writing',
          'LinkedIn profile optimization',
          'Career documents',
          'Applicant tracking systems',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'SANAD',
        alternateName: BRAND_ALTERNATE_NAMES,
        inLanguage: isArabic ? 'ar' : 'en',
        publisher: { '@id': organizationId },
      },
    ],
  };
}
