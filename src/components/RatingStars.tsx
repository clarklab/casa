import { useState, useCallback } from 'react';

interface RatingStarsProps {
  rating?: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
}

const CONFETTI_COLORS = ['#ff5733', '#ffb347', '#ff6b6b', '#ffd700', '#ff8c69', '#ffa07a'];

function getRandomParticles() {
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

export function RatingStars({ rating = 0, onChange, size = 'sm' }: RatingStarsProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const [particles, setParticles] = useState<ReturnType<typeof getRandomParticles>>([]);

  const handleClick = useCallback((e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    const newRating = star === rating ? 0 : star;
    onChange?.(newRating);

    // Only animate if setting a rating (not clearing)
    if (newRating > 0) {
      setPoppedStar(star);
      setParticles(getRandomParticles());
      setTimeout(() => {
        setPoppedStar(null);
        setParticles([]);
      }, 400);
    }
  }, [rating, onChange]);

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="relative inline-block">
          <button
            onClick={(e) => handleClick(e, star)}
            disabled={!onChange}
            className={`transition-colors ${onChange ? 'active:scale-110' : ''} ${
              star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
            }`}
            style={poppedStar === star ? {
              animation: 'starPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            } : undefined}
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
      ))}
    </div>
  );
}
