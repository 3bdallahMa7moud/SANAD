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
  'UAE Job Application Guide',
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

  it('describes Job Application Service email outreach without OTP steps', () => {
    const content = getPackageDetailContent({
      name: 'Job Application Service',
    } as CareerPackage);
    const faqCopy = content.faqs.flatMap((item) => [
      item.question,
      item.questionAr,
      item.answer,
      item.answerAr,
    ]);

    expect(faqCopy.join(' ')).toContain(
      'send it with your CV directly to up to 60 suitable companies using your email account',
    );
    expect(faqCopy.join(' ')).not.toMatch(/OTP|one-time code/i);
  });

  it('describes the UAE guide format and keeps it separate from performed outreach', () => {
    const content = getPackageDetailContent({
      name: 'UAE Job Application Guide',
    } as CareerPackage);

    expect(content.importantNote).toContain('38-page PDF delivered in Arabic');
    expect(content.importantNoteAr).toContain('38 صفحة');
    expect(content.faqs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: 'Does purchasing the guide include applications by SANAD?',
          answer: expect.stringContaining('separate Job Application Service'),
        }),
      ]),
    );
  });
});
