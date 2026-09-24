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
});
