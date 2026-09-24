import { describe, expect, it } from 'vitest';

import { hasArabicTranslation } from './has-arabic-translation';

describe('hasArabicTranslation', () => {
  it('accepts Arabic CMS content', () => {
    expect(hasArabicTranslation('سياسة الخصوصية')).toBe(true);
  });

  it('rejects absent or English-only CMS content', () => {
    expect(hasArabicTranslation(undefined)).toBe(false);
    expect(hasArabicTranslation('Privacy Policy')).toBe(false);
  });

  it('rejects English body copy under an Arabic CMS heading', () => {
    expect(
      hasArabicTranslation(
        '<h2>قبول الشروط</h2><p>By placing an order, you agree to these terms and conditions.</p>',
      ),
    ).toBe(false);
  });
});
