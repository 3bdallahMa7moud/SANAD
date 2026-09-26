import { render, screen } from '@/test/render';
import { describe, expect, it } from 'vitest';

import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  it('serves the original light and dark PNG files without optimization', () => {
    const { container } = render(<BrandLogo loading="eager" />);
    const images = [...container.querySelectorAll('img')];

    expect(screen.getByRole('img', { name: 'SANAD' })).toBeVisible();
    expect(images).toHaveLength(2);
    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      '/brand/sanad-logo-navy.png',
      '/brand/sanad-logo-dark.png',
    ]);
    expect(images.every((image) => !image.hasAttribute('srcset'))).toBe(true);
  });
});
