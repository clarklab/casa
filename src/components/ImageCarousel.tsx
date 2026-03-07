import { useState, useRef, useCallback } from 'react';
import { Stepper, useAutoPlay } from 'pasito/react';
import 'pasito/styles.css';
import { api } from '@/lib/api';

interface ImageCarouselProps {
  imageKeys: string[];
  alt: string;
  className?: string;
  viewTransitionName?: string;
  /** Max dots to show before windowing kicks in (default: 7) */
  maxDots?: number;
  /** Auto-advance interval in ms. 0 = disabled. (default: 0) */
  autoPlayInterval?: number;
}

export function ImageCarousel({
  imageKeys,
  alt,
  className = '',
  viewTransitionName,
  maxDots = 7,
  autoPlayInterval = 0,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = imageKeys.length;
  const minSwipeDistance = 50;

  const autoPlay = useAutoPlay({
    count: total,
    active: current,
    onStepChange: setCurrent,
    stepDuration: autoPlayInterval || 3000,
    loop: true,
    enabled: autoPlayInterval > 0 && total > 1,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0 && current < total - 1) {
      setCurrent(current + 1);
    } else if (distance < 0 && current > 0) {
      setCurrent(current - 1);
    }
  }, [current, total]);

  if (total === 0) {
    return (
      <div className={`bg-slate-200 dark:bg-slate-800 flex items-center justify-center ${className}`}>
        <span className="text-slate-400 text-4xl">🏠</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {imageKeys.map((key, i) => (
          <img
            key={key}
            src={api.getImageUrl(key)}
            alt={`${alt} photo ${i + 1}`}
            className="w-full h-full object-cover flex-shrink-0"
            loading={i === 0 ? 'eager' : 'lazy'}
            style={i === 0 && viewTransitionName ? { viewTransitionName } : undefined}
          />
        ))}
      </div>

      {/* Pasito stepper dots */}
      {total > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <Stepper
            count={total}
            active={current}
            onStepClick={setCurrent}
            maxVisible={maxDots}
            filling={autoPlay.filling}
            fillDuration={autoPlay.fillDuration}
            className="pasito-carousel"
          />
        </div>
      )}
    </div>
  );
}
