'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCopy } from '@/lib/i18n/use-copy';

const VISIBILITY_SCROLL_OFFSET = 320;

function usesReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ScrollToTopButton() {
  const _copy = useCopy();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > VISIBILITY_SCROLL_OFFSET);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: usesReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      aria-label={_copy('Back to top', 'العودة إلى أعلى الصفحة')}
      className={`fixed bottom-6 left-6 z-50 grid size-12 place-items-center rounded-full border border-border bg-surface text-primary shadow-lg transition-[opacity,transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:bg-surface-muted hover:shadow-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      onClick={scrollToTop}
      type="button"
    >
      <ArrowUp aria-hidden="true" className="size-5" strokeWidth={2.25} />
    </button>
  );
}
