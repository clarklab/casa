import { useState, useCallback, useRef } from 'react';

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
}

const CONFETTI_COLORS = ['#ff5733', '#ffb347', '#ff6b6b', '#ffd700', '#ff8c69', '#ffa07a'];
const STAR_COUNT = 5;

function getRandomParticles(): Particle[] {
  return Array.from({ length: 7 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5) * 0.5;
    const distance = 18 + Math.random() * 14;
    return {
      id: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
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
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const displayRating = previewRating ?? rating;

  const fireConfetti = useCallback((star: number) => {
    setPoppedStar(star);
    setParticles(getRandomParticles());
    setTimeout(() => {
      setPoppedStar(null);
      setParticles([]);
    }, 400);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    // Ignore clicks that follow a drag (touchEnd already committed)
    if (isDragging.current) return;
    const newRating = star === rating ? 0 : star;
    onChange?.(newRating);
    if (newRating > 0) {
      fireConfetti(star);
    }
  }, [rating, onChange, fireConfetti]);

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
    const newRating = finalRating === rating ? 0 : finalRating;
    onChange?.(newRating);
    if (newRating > 0) {
      fireConfetti(newRating);
    }
    setPreviewRating(null);
    // Delay clearing drag flag so the click handler ignores the synthetic click
    requestAnimationFrame(() => {
      isDragging.current = false;
    });
  }, [previewRating, rating, onChange, fireConfetti]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-0.5 ${sizeClass}`}
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        const isActiveDragStar = previewRating !== null && star === previewRating;
        const isNewlyFilled = previewRating !== null && isFilled && star > rating;

        return (
          <span key={star} className="relative inline-block">
            <button
              onClick={(e) => handleClick(e, star)}
              disabled={!onChange}
              className={`transition-all duration-75 ${onChange ? 'active:scale-110' : ''} ${
                isFilled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
              } ${isActiveDragStar ? 'star-glow' : ''}`}
              style={{
                ...(poppedStar === star ? {
                  animation: 'starPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                } : {}),
                ...(isNewlyFilled ? {
                  transform: 'scale(1.15)',
                  transition: `transform 60ms ease-out ${(star - 1) * 30}ms`,
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
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: p.color,
                  ['--tx' as string]: `${p.tx}px`,
                  ['--ty' as string]: `${p.ty}px`,
                  animation: 'starConfetti 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                }}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}
