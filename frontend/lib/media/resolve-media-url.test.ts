import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env/public-env', () => ({
  getApiBaseUrl: () => 'https://api.sanad.example/api/v1',
}));

import { resolveMediaUrl } from './resolve-media-url';

describe('resolveMediaUrl', () => {
  it('resolves signed local storage URLs against the API origin', () => {
    expect(
      resolveMediaUrl('/api/v1/storage/local?key=packages%2F1%2Fimage.webp'),
    ).toBe(
      'https://api.sanad.example/api/v1/storage/local?key=packages%2F1%2Fimage.webp',
    );
  });

  it('preserves absolute and packaged image URLs', () => {
    expect(resolveMediaUrl('https://cdn.example/image.webp')).toBe(
      'https://cdn.example/image.webp',
    );
    expect(resolveMediaUrl('/images/package.webp')).toBe(
      '/images/package.webp',
    );
    expect(resolveMediaUrl('packages/1/image.webp')).toBeNull();
  });
});
