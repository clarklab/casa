import { useState, useCallback, useRef, useEffect } from 'react';

interface RatingStarsProps {
  rating?: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
}

interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
}

const CONFETTI_COLORS = ['#ff5733', '#ffb347', '#ff6b6b', '#ffd700', '#ff8c69', '#ffa07a', '#ff4081', '#7c4dff', '#00e676'];
const STAR_COUNT = 5;

function getRandomParticles(): Particle[] {
  // 3x more particles — 20 instead of 7, with bigger spread
  return Array.from({ length: 20 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.8;
    const distance = 30 + Math.random() * 40;
    return {
      id: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 5 + Math.random() * 5,
      delay: Math.random() * 80,
    };
  });
}

function getStarFromX(containerEl: HTMLDivElement, clientX: number): number {
  const rect = containerEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const ratio = x / rect.width;
  const star = Math.ceil(ratio * STAR_COUNT);
  return Math.max(1, Math.min(STAR_COUNT, star));
}

export function RatingStars({ rating = 0, onChange, size = 'sm' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  const [localRating, setLocalRating] = useState(rating);
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Sync local rating when the prop changes (e.g. after server response)
  useEffect(() => {
    setLocalRating(rating);
  }, [rating]);

  const displayRating = previewRating ?? localRating;

  const fireConfetti = useCallback((star: number) => {
    setPoppedStar(star);
    setParticles(getRandomParticles());
    setTimeout(() => {
      setPoppedStar(null);
      setParticles([]);
    }, 700);
  }, []);

  const commitRating = useCallback((star: number) => {
    const newRating = star === localRating ? 0 : star;
    // Immediately set local state so stars stay put
    setLocalRating(newRating);
    onChange?.(newRating);
    if (newRating > 0) {
      fireConfetti(star);
    }
  }, [localRating, onChange, fireConfetti]);

  const handleClick = useCallback((e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDragging.current) return;
    commitRating(star);
  }, [commitRating]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onChange || !containerRef.current) return;
    isDragging.current = true;
    const star = getStarFromX(containerRef.current, e.touches[0].clientX);
    setPreviewRating(star);
  }, [onChange]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const star = getStarFromX(containerRef.current, e.touches[0].clientX);
    setPreviewRating(star);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    const finalRating = previewRating ?? 0;
    const newRating = finalRating === localRating ? 0 : finalRating;
    setLocalRating(newRating);
    onChange?.(newRating);
    if (newRating > 0) {
      fireConfetti(newRating);
    }
    setPreviewRating(null);
    requestAnimationFrame(() => {
      isDragging.current = false;
    });
  }, [previewRating, localRating, onChange, fireConfetti]);

  const interactive = !!onChange;

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-1 ${interactive ? 'rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5' : ''} ${starSize}`}
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isActiveDragStar = previewRating !== null && star === previewRating;
          const isNewlyFilled = previewRating !== null && isFilled && star > localRating;

          return (
            <span key={star} className="relative inline-block">
              <button
                onClick={(e) => handleClick(e, star)}
                disabled={!onChange}
                className={`transition-all duration-75 select-none ${interactive ? 'active:scale-125 cursor-pointer' : ''} ${
                  isFilled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                } ${isActiveDragStar ? 'star-glow' : ''}`}
                style={{
                  padding: '2px 1px',
                  minWidth: size === 'sm' ? 24 : 32,
                  minHeight: size === 'sm' ? 24 : 32,
                  ...(poppedStar === star ? {
                    animation: 'starPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  } : {}),
                  ...(isNewlyFilled ? {
                    transform: 'scale(1.2)',
                    transition: `transform 80ms ease-out ${(star - 1) * 30}ms`,
                  } : {}),
                }}
                aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
              {poppedStar === star && particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                    background: p.color,
                    ['--tx' as string]: `${p.tx}px`,
                    ['--ty' as string]: `${p.ty}px`,
                    animation: `starConfetti 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms forwards`,
                  }}
                />
              ))}
            </span>
          );
        })}
      </div>
      {interactive && displayRating > 0 && (
        <span className="text-sm font-bold text-amber-500 dark:text-amber-400 ml-1 min-w-[1.25rem] text-center tabular-nums">
          {displayRating}
        </span>
      )}
    </div>
  );
}
