import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoPlayKey, setAutoPlayKey] = useState(0);

  const total = imageKeys.length;
  const minSwipeDistance = 50;

  // Auto-advance
  useEffect(() => {
    if (autoPlayInterval <= 0 || total <= 1 || isHovered) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
      setAutoPlayKey((k) => k + 1);
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlayInterval, total, isHovered]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setAutoPlayKey((k) => k + 1);
  }, []);

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
      goTo(current + 1);
    } else if (distance < 0 && current > 0) {
      goTo(current - 1);
    }
  }, [current, total, goTo]);

  // Compute visible dot window
  const visibleDots = useMemo(() => {
    if (total <= maxDots) {
      return { start: 0, end: total };
    }
    // Keep current dot roughly centered in the window
    const half = Math.floor(maxDots / 2);
    let start = current - half;
    let end = start + maxDots;

    if (start < 0) {
      start = 0;
      end = maxDots;
    } else if (end > total) {
      end = total;
      start = end - maxDots;
    }

    return { start, end };
  }, [current, total, maxDots]);

  if (total === 0) {
    return (
      <div className={`bg-slate-200 dark:bg-slate-800 flex items-center justify-center ${className}`}>
        <span className="text-slate-400 text-4xl">🏠</span>
      </div>
    );
  }

  const showDots = total > 1;
  const useWindowing = total > maxDots;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Dot indicators — Pasito-style with windowing + fill animation */}
      {showDots && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1">
          {/* Left overflow indicator */}
          {useWindowing && visibleDots.start > 0 && (
            <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
          )}

          {Array.from({ length: visibleDots.end - visibleDots.start }, (_, i) => {
            const dotIndex = visibleDots.start + i;
            const isActive = dotIndex === current;

            return (
              <button
                key={dotIndex}
                onClick={(e) => { e.stopPropagation(); goTo(dotIndex); }}
                className={`h-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                  isActive ? 'w-5' : 'w-1.5'
                }`}
                style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                aria-label={`View photo ${dotIndex + 1}`}
              >
                {/* Fill bar for active dot (auto-play timer) */}
                {isActive && autoPlayInterval > 0 && !isHovered && (
                  <span
                    key={autoPlayKey}
                    className="absolute inset-0 rounded-full bg-white origin-left"
                    style={{
                      animation: `dotFill ${autoPlayInterval}ms linear forwards`,
                    }}
                  />
                )}
                {/* Static fill for active dot when no autoplay or hovered */}
                {isActive && (autoPlayInterval <= 0 || isHovered) && (
                  <span className="absolute inset-0 rounded-full bg-white" />
                )}
              </button>
            );
          })}

          {/* Right overflow indicator */}
          {useWindowing && visibleDots.end < total && (
            <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
          )}
        </div>
      )}

      {/* Keyframe for fill animation */}
      <style>{`
        @keyframes dotFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
