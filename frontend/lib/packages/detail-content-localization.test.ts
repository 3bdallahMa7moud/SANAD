import { describe, expect, it } from 'vitest';

import { translateCopy } from '@/lib/i18n/copy';
import type { CareerPackage } from '@/types/domain';

import { getPackageDetailContent } from './detail-content';

const packageNames = [
  'Premium Full Package',
  'Full Package',
  'Professional Package',
  'Professional CV',
  'LinkedIn Profile Optimization',
  'Job Application Service',
  'A future package without custom content',
];

describe('package detail localization', () => {
  it.each(packageNames)(
    'provides Arabic preparation and process copy for %s',
    (name) => {
      const content = getPackageDetailContent({ name } as CareerPackage);
      const visibleCopy = [
        ...content.preparation,
        ...content.process.flatMap((step) => [step.title, step.description]),
      ];

      for (const value of visibleCopy) {
        expect(translateCopy(value, 'ar'), value).not.toBe(value);
      }
    },
  );

  it('translates the final-delivery description shown in the Arabic package card', () => {
    expect(
      translateCopy(
        'You review the completed work and confirm that the agreed scope has been delivered.',
        'ar',
      ),
    ).toBe('تراجع العمل المكتمل وتتأكد من تسليم النطاق المتفق عليه.');
  });
});
