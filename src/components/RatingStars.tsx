interface RatingStarsProps {
  rating?: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
}

export function RatingStars({ rating = 0, onChange, size = 'sm' }: RatingStarsProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(star === rating ? 0 : star);
          }}
          disabled={!onChange}
          className={`transition-colors ${onChange ? 'active:scale-110' : ''} ${
            star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
          }`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
