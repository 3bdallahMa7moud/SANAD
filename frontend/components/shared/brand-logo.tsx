import { useCopy } from '@/lib/i18n/use-copy';

import { cn } from '@/lib/utils/cn';

const logoSizes = {
  sm: 'w-24',
  md: 'w-36',
  lg: 'w-48',
} as const;

export interface BrandLogoProps {
  alt?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  size?: keyof typeof logoSizes;
  tone?: 'adaptive' | 'beige' | 'navy';
}

export function BrandLogo({
  alt = 'SANAD',
  className,
  size = 'md',
  tone = 'adaptive',
}: BrandLogoProps) {
  const _copy = useCopy();

  return (
    <span
      aria-label={_copy(alt)}
      className={cn(
        logoSizes[size],
        'brand-logo',
        `brand-logo--${tone}`,
        className,
      )}
      role="img"
    />
  );
}
