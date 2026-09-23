import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import Home from './page';

const neverResolves = vi.hoisted(() => new Promise<never>(() => undefined));

vi.mock('@/components/home/featured-packages', () => ({
  FeaturedPackages: () => {
    throw neverResolves;
  },
}));
vi.mock('@/components/home/testimonials', () => ({
  Testimonials: () => {
    throw neverResolves;
  },
}));
vi.mock('@/components/home/hero-section', () => ({ HeroSection: () => null }));
vi.mock('@/components/home/career-story', () => ({ CareerStory: () => null }));
vi.mock('@/components/home/final-cta', () => ({ FinalCta: () => null }));
vi.mock('@/components/home/how-it-works', () => ({ HowItWorks: () => null }));
vi.mock('@/components/home/premium-cta', () => ({ PremiumCta: () => null }));
vi.mock('@/components/home/uae-career-focus', () => ({
  UaeCareerFocus: () => null,
}));
vi.mock('@/components/home/why-sanad', () => ({ WhySanad: () => null }));

describe('Home streaming fallbacks', () => {
  it('keeps both suspended sections visible instead of rendering empty gaps', () => {
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        <Home />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole('status', { name: 'Loading featured services...' }),
    ).toBeVisible();
    expect(
      screen.getByRole('status', { name: 'Loading client feedback...' }),
    ).toBeVisible();
  });
});
