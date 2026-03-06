import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

interface ImageCarouselProps {
  imageKeys: string[];
  alt: string;
  className?: string;
  viewTransitionName?: string;
}

export function ImageCarousel({ imageKeys, alt, className = '', viewTransitionName }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

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

    if (distance > 0 && current < imageKeys.length - 1) {
      setCurrent((c) => c + 1);
    } else if (distance < 0 && current > 0) {
      setCurrent((c) => c - 1);
    }
  }, [current, imageKeys.length]);

  if (imageKeys.length === 0) {
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

      {/* Dot indicators */}
      {imageKeys.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
          {imageKeys.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-white w-3' : 'bg-white/50'
              }`}
              aria-label={`View photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
