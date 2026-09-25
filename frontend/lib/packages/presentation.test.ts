import { describe, expect, it } from 'vitest';
import type { CareerPackage } from '@/types/domain';
import {
  formatDeliveryEstimate,
  getPackageCurrentPrice,
  getPackageFeaturePairs,
} from './presentation';

function packageWithLimitedOffer(price: number): CareerPackage {
  return {
    id: 1,
    name: 'Package',
    description: null,
    price,
    features: [],
    deliveryDays: 1,
    sortOrder: 1,
    images: [],
    offers: [
      {
        id: 1,
        name: '50% OFF (Limited Offer)',
        description: null,
        discountPercentage: 50,
      },
    ],
    buyerCount: 0,
    ratingAverage: null,
    ratingCount: 0,
  };
}

describe('limited package pricing', () => {
  it.each([
    [800, 400],
    [650, 325],
    [250, 125],
  ])('reduces %s AED to %s AED', (originalPrice, expectedPrice) => {
    expect(getPackageCurrentPrice(packageWithLimitedOffer(originalPrice))).toBe(
      expectedPrice,
    );
  });
});

describe('delivery estimate copy', () => {
  it('uses singular and plural day labels in English and Arabic', () => {
    expect(formatDeliveryEstimate(1, 'en')).toBe('1 day estimated');
    expect(formatDeliveryEstimate(3, 'en')).toBe('3 days estimated');
    expect(formatDeliveryEstimate(1, 'ar')).toBe('يوم تقريبًا');
    expect(formatDeliveryEstimate(3, 'ar')).toBe('3 أيام تقريبًا');
  });
});

describe('package feature presentation', () => {
  it('keeps every admin-defined feature in its published order', () => {
    const features = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    const featuresAr = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];

    expect(getPackageFeaturePairs({ features, featuresAr })).toEqual(
      features.map((feature, index) => ({
        en: feature,
        ar: featuresAr[index],
      })),
    );
  });
});
