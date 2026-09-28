import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import englishMessages from '@/messages/en.json';
import type { CareerPackage, PackageReview } from '@/types/domain';

import { CareerStory } from './career-story';
import { FeaturedPackageCard } from './featured-packages-content';
import { HeroSection } from './hero-section';
import { TestimonialsCarousel } from './testimonials-carousel';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    unoptimized,
  }: {
    alt: string;
    src: { src?: string } | string;
    unoptimized?: boolean;
  }) => (
    <span
      aria-label={alt}
      data-src={typeof src === 'string' ? src : src.src}
      data-unoptimized={unoptimized || undefined}
      role="img"
    />
  ),
}));

vi.mock('./hero-offer-visual', () => ({
  HeroOfferVisual: ({ imageAlt }: { imageAlt: string }) => (
    <span aria-label={imageAlt} role="img" />
  ),
}));

vi.mock('@/components/feedback/verified-review-card', () => ({
  VerifiedReviewCard: ({ review }: { review: PackageReview }) => (
    <article>{review.comment}</article>
  ),
}));

vi.mock('@/lib/i18n/server-copy', () => ({
  getCopy: async () => (value: string) => value,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

function renderWithEnglish(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={englishMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function packageItem(name: string): CareerPackage {
  return {
    id: 1,
    name,
    description: 'A focused professional service.',
    price: 250,
    features: [],
    deliveryDays: 5,
    sortOrder: 1,
    images: [],
    offers: [],
    buyerCount: 0,
    ratingAverage: null,
    ratingCount: 0,
  };
}

const reviews: PackageReview[] = [
  {
    id: 1,
    userId: 1,
    packageId: 1,
    orderId: 1,
    rating: 5,
    comment: 'First review',
    status: 'published',
    isHomeFeatured: true,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 2,
    userId: 2,
    packageId: 2,
    orderId: 2,
    rating: 5,
    comment: 'Second review',
    status: 'published',
    isHomeFeatured: true,
    createdAt: null,
    updatedAt: null,
  },
];

describe('home visual sections', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('renders the hero media', async () => {
    renderWithEnglish(await HeroSection());

    expect(screen.getByRole('img')).toHaveAttribute(
      'data-src',
      '/images/home/sanad-career-services-hero-v4.webp',
    );
  });

  it('renders the original career story image directly', async () => {
    const { container } = renderWithEnglish(await CareerStory());
    const image = container.querySelector(
      '[data-src="/images/home/career-story.webp?v=e4039fda"]',
    );

    expect(image).toHaveAttribute(
      'data-src',
      '/images/home/career-story.webp?v=e4039fda',
    );
    expect(image).toHaveAttribute('data-unoptimized', 'true');
  });

  it.each([
    [
      'Professional Package',
      'file',
      'professional.category',
      'career-excellence-package.webp',
    ],
    [
      'Premium Bilingual Package',
      'layout',
      'full.category',
      'golden-signature-package.webp',
    ],
    [
      'Full Package',
      'layout',
      'full.category',
      'career-excellence-package.webp',
    ],
    [
      'LinkedIn Profile Optimization',
      'user',
      'linkedin.category',
      'linkedin-profile-optimization.webp',
    ],
  ] as const)(
    'shows the matching WebP image for %s',
    (name, icon, categoryKey, imageFile) => {
      renderWithEnglish(
        <FeaturedPackageCard
          categoryKey={categoryKey}
          icon={icon}
          packageItem={packageItem(name)}
          rates={null}
        />,
      );

      expect(screen.getByRole('img', { name })).toHaveAttribute(
        'data-src',
        expect.stringContaining(imageFile),
      );
    },
  );

  it('uses the administrator-uploaded service image before the fallback image', () => {
    const item = packageItem('Full Package');
    item.images = [
      {
        id: 19,
        path: '/uploads/packages/full-package.webp',
        url: 'https://api.sanad.test/uploads/packages/full-package.webp',
        altText: 'Admin-selected full package image',
        isPrimary: true,
        displayOrder: 0,
      },
    ];

    renderWithEnglish(
      <FeaturedPackageCard
        categoryKey="full.category"
        icon="layout"
        packageItem={item}
        rates={null}
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Admin-selected full package image' }),
    ).toHaveAttribute(
      'data-src',
      'https://api.sanad.test/uploads/packages/full-package.webp',
    );
  });

  it('keeps the feedback wall keyboard-focusable', () => {
    renderWithEnglish(<TestimonialsCarousel reviews={reviews} />);

    const carousel = screen.getByRole('group', {
      name: 'Customer reviews',
    });

    expect(carousel).toHaveAttribute('tabindex', '0');
    expect(carousel.querySelector('.reviews-loop-copy')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('creates buffered copies of a larger feedback list for dragging and a seamless loop', () => {
    const pagingReviews = [
      ...reviews,
      { ...reviews[0], id: 3, comment: 'Third review' },
      { ...reviews[1], id: 4, comment: 'Fourth review' },
    ];

    const { container } = renderWithEnglish(
      <TestimonialsCarousel reviews={pagingReviews} />,
    );

    const groups = container.querySelectorAll('.reviews-loop-group');

    expect(groups).toHaveLength(3);
    expect(groups[0]?.children).toHaveLength(4);
    expect(groups[1]?.children).toHaveLength(4);
    expect(groups[2]?.children).toHaveLength(4);
  });

  it('moves the feedback wall automatically', () => {
    const frames: FrameRequestCallback[] = [];
    let frameId = 0;
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.push(callback);
        frameId += 1;
        return frameId;
      });
    const cancelFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const { container, unmount } = renderWithEnglish(
      <TestimonialsCarousel reviews={reviews} />,
    );
    const carousel = container.querySelector<HTMLElement>('.reviews-loop')!;
    Object.defineProperty(carousel, 'scrollWidth', {
      configurable: true,
      value: 3_000,
    });

    const runNextFrame = (time: number) => {
      const callback = frames.shift();
      expect(callback).toBeDefined();
      act(() => callback?.(time));
    };

    runNextFrame(0);
    runNextFrame(0);
    expect(carousel.scrollLeft).toBe(1_000);

    runNextFrame(64);
    expect(carousel.scrollLeft).toBeGreaterThan(1_000);

    unmount();
    requestFrame.mockRestore();
    cancelFrame.mockRestore();
  });

  it.each(['mouse', 'touch'])('supports free %s dragging', (pointerType) => {
    const { container } = renderWithEnglish(
      <TestimonialsCarousel reviews={reviews} />,
    );
    const carousel = container.querySelector<HTMLElement>('.reviews-loop')!;
    Object.defineProperty(carousel, 'scrollWidth', {
      configurable: true,
      value: 3_000,
    });
    carousel.scrollLeft = 1_000;

    fireEvent.pointerDown(carousel, {
      button: 0,
      clientX: 500,
      pointerId: 7,
      pointerType,
    });
    fireEvent.pointerMove(carousel, {
      clientX: 350,
      pointerId: 7,
      pointerType,
    });

    expect(carousel).toHaveAttribute('data-dragging', 'true');
    expect(carousel.scrollLeft).toBe(1_150);

    fireEvent.pointerUp(carousel, { pointerId: 7, pointerType });
    expect(carousel).toHaveAttribute('data-dragging', 'false');
  });
});
