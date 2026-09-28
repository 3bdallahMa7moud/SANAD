'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { VerifiedReviewCard } from '@/components/feedback/verified-review-card';
import { useCopy } from '@/lib/i18n/use-copy';
import type { PackageReview } from '@/types/domain';

const AUTO_SCROLL_PIXELS_PER_MS = 0.052;
const RESUME_AFTER_INTERACTION_MS = 900;

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
}

function normalizeLoopPosition(element: HTMLDivElement): number {
  const segmentWidth = element.scrollWidth / 3;
  if (!Number.isFinite(segmentWidth) || segmentWidth <= 0) return 0;

  let shift = 0;
  if (element.scrollLeft < segmentWidth * 0.5) shift = segmentWidth;
  if (element.scrollLeft > segmentWidth * 1.5) shift = -segmentWidth;
  if (shift !== 0) element.scrollLeft += shift;
  return shift;
}

export function TestimonialsCarousel({
  reviews,
}: {
  reviews: PackageReview[];
}) {
  const _copy = useCopy();
  const instructionsId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pauseUntilRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const canLoop = reviews.length > 1;
  const copies = canLoop ? [0, 1, 2] : [0];

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || !canLoop) return;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const frame = window.requestAnimationFrame(() => {
      element.scrollLeft = reducedMotion ? 0 : element.scrollWidth / 3;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [canLoop, reviews.length]);

  useEffect(() => {
    const element = viewportRef.current;
    if (
      !element ||
      !canLoop ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frame = 0;
    let previousTime: number | null = null;
    let pendingDistance = 0;
    const animate = (time: number) => {
      if (
        previousTime !== null &&
        dragRef.current === null &&
        time >= pauseUntilRef.current
      ) {
        const elapsed = Math.min(time - previousTime, 64);
        pendingDistance += elapsed * AUTO_SCROLL_PIXELS_PER_MS;
        const wholePixels = Math.trunc(pendingDistance);
        if (wholePixels > 0) {
          element.scrollLeft += wholePixels;
          pendingDistance -= wholePixels;
          normalizeLoopPosition(element);
        }
      }
      previousTime = time;
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [canLoop, reviews.length]);

  const startDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canLoop || event.button !== 0) return;
    const element = viewportRef.current;
    if (!element) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: element.scrollLeft,
      moved: false,
    };
    pauseUntilRef.current = Number.POSITIVE_INFINITY;
    suppressClickRef.current = false;
    element.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const moveDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const element = viewportRef.current;
    if (!drag || !element || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 3) {
      drag.moved = true;
      suppressClickRef.current = true;
      event.preventDefault();
    }
    element.scrollLeft = drag.startScrollLeft - delta;
    drag.startScrollLeft += normalizeLoopPosition(element);
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const element = viewportRef.current;
    dragRef.current = null;
    if (element?.hasPointerCapture?.(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    pauseUntilRef.current = performance.now() + RESUME_AFTER_INTERACTION_MS;
    setDragging(false);
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const element = viewportRef.current;
    if (!element) return;
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    element.scrollBy({
      left: direction * Math.max(element.clientWidth * 0.75, 240),
      behavior: 'smooth',
    });
    pauseUntilRef.current = performance.now() + RESUME_AFTER_INTERACTION_MS;
  };

  return (
    <div className="mt-9 sm:mt-10">
      <p className="sr-only" id={instructionsId}>
        {_copy(
          'Drag horizontally with the mouse or touch, or use the left and right arrow keys.',
          'اسحب أفقيًا بالماوس أو اللمس، أو استخدم سهمي اليمين واليسار.',
        )}
      </p>
      <div
        aria-describedby={instructionsId}
        aria-label={_copy('Customer reviews', 'تقييمات العملاء')}
        className="reviews-loop"
        data-count={reviews.length}
        data-dragging={dragging}
        dir="ltr"
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={moveWithKeyboard}
        onLostPointerCapture={finishDragging}
        onPointerCancel={finishDragging}
        onPointerDown={startDragging}
        onPointerMove={moveDragging}
        onPointerUp={finishDragging}
        ref={viewportRef}
        role="group"
        tabIndex={0}
      >
        <div className="reviews-loop-track">
          {copies.map((copyIndex) => (
            <ul
              aria-hidden={copyIndex === 0 ? undefined : 'true'}
              className={`reviews-loop-group${copyIndex === 0 ? '' : ' reviews-loop-copy'}`}
              inert={copyIndex === 0 ? undefined : true}
              key={copyIndex}
            >
              {reviews.map((review) => (
                <li
                  className="reviews-loop-card"
                  dir={_copy.locale === 'ar' ? 'rtl' : 'ltr'}
                  key={review.id}
                >
                  <VerifiedReviewCard review={review} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
