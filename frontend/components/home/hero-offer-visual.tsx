'use client';

import Image from 'next/image';
import { useCopy } from '@/lib/i18n/use-copy';
const careerDocuments = '/images/home/career-documents.webp';

export function HeroOfferVisual({ imageAlt }: { imageAlt: string }) {
  const _copy = useCopy();
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      <Image
        alt={_copy(imageAlt)}
        className="object-contain transition-transform duration-500 ease-[var(--ease-standard)] motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-visible:scale-[1.035] motion-reduce:transition-none"
        fill
        preload
        sizes="(max-width: 1023px) calc(100vw - 2rem), 42vw"
        src={careerDocuments}
      />
    </div>
  );
}
