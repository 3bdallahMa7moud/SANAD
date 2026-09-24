import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

import { HeroOfferVisual } from './hero-offer-visual';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

describe('HeroOfferVisual', () => {
  it('shows the service artwork without advertising the FIRST50 promotion', () => {
    render(<HeroOfferVisual imageAlt="SANAD career services" />);

    expect(
      screen.getByRole('img', { name: 'SANAD career services' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('FIRST50')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
