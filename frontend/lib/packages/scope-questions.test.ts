import { describe, expect, it } from 'vitest';

import type { CareerPackage } from '@/types/domain';

import { getScopeQuestions } from './scope-questions';

function packageNamed(name: string): CareerPackage {
  return {
    id: 1,
    name,
    description: null,
    price: 100,
    features: [],
    deliveryDays: 1,
    sortOrder: 1,
    images: [],
    offers: [],
    buyerCount: 0,
    ratingAverage: null,
    ratingCount: 0,
  };
}

describe('service scope questions', () => {
  it.each([
    'Professional CV',
    'Professional Package',
    'Full Package',
    'Premium Full Package',
    'LinkedIn Profile Optimization',
    'UAE Job Application Guide',
    'Job Application Service',
  ])('provides bilingual questions and answers for %s', (name) => {
    const items = getScopeQuestions(packageNamed(name));

    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const item of items) {
      expect(item.en).not.toBe('');
      expect(item.ar).not.toBe('');
      expect(item.answerEn).not.toBe('');
      expect(item.answerAr).not.toBe('');
    }
  });

  it('provides answered fallback questions for future services', () => {
    const items = getScopeQuestions(packageNamed('Future Service'));

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.answerEn && item.answerAr)).toBe(true);
  });
});
