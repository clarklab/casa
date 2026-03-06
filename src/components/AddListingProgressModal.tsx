import { useEffect, useState, useRef } from 'react';
import { formatPriceFull } from '@/lib/format';
import type { ScrapeResponse } from '@/lib/types';

interface AddListingProgressModalProps {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  result?: ScrapeResponse;
  errorMessage?: string;
  onClose: () => void;
  onRetry: () => void;
}

const NARRATION_STEPS = [
  'Fetching listing page...',
  'Extracting property details...',
  'Downloading photos...',
  'Crunching the numbers...',
];

const CONFETTI_COLORS = [
  '#ff5733', '#ff7a5c', '#ffa58e', '#ffc9b8',
  '#34d399', '#60a5fa', '#a78bfa', '#fbbf24',
];

export function AddListingProgressModal({
  isOpen,
  status,
  result,
  errorMessage,
  onClose,
  onRetry,
}: AddListingProgressModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const autocloseRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Rotate narration steps while loading
  useEffect(() => {
    if (status !== 'loading') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setStepIndex(0);
    setStepKey(0);
    intervalRef.current = setInterval(() => {
      setStepIndex((i) => (i + 1) % NARRATION_STEPS.length);
      setStepKey((k) => k + 1);
    }, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  // Auto-close on success after 2s
  useEffect(() => {
    if (status === 'success') {
      autocloseRef.current = setTimeout(onClose, 2000);
      return () => {
        if (autocloseRef.current) clearTimeout(autocloseRef.current);
      };
    }
  }, [status, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setStepKey(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={status === 'error' ? onClose : undefined}
      />

      {/* Card */}
      <div className="relative mx-6 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
        {status === 'loading' && <LoadingState step={NARRATION_STEPS[stepIndex]} stepKey={stepKey} />}
        {status === 'success' && <SuccessState result={result} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={onRetry} onClose={onClose} />}
      </div>
    </div>
  );
}

function LoadingState({ step, stepKey }: { step: string; stepKey: number }) {
  return (
    <>
      {/* Pulsing home icon */}
      <div className="w-16 h-16 rounded-full bg-casa-100 dark:bg-casa-900/30 flex items-center justify-center mb-6 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" className="fill-casa-500">
          <path d="M220-180h150v-250h220v250h150v-390L480-765 220-570v390Zm-60 60v-480l320-240 320 240v480H530v-250H430v250H160Z" />
        </svg>
      </div>

      {/* Spinner */}
      <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-casa-500 rounded-full animate-spin mb-5" />

      {/* Narration text */}
      <p
        key={stepKey}
        className="text-sm font-medium text-slate-600 dark:text-slate-300"
        style={{ animation: 'fadeInUp 0.4s ease-out' }}
      >
        {step}
      </p>
    </>
  );
}

function SuccessState({ result }: { result?: ScrapeResponse }) {
  const listing = result?.listing;

  return (
    <>
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {CONFETTI_COLORS.map((color, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              left: `${15 + i * 10}%`,
              bottom: '40%',
              animation: `confettiBurst 1s ease-out ${i * 0.08}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Checkmark */}
      <div
        className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5"
        style={{ animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="44" viewBox="0 -960 960 960" width="44" className="fill-emerald-500">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        </svg>
      </div>

      {/* Property info */}
      {listing ? (
        <div style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
          <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {listing.address}
          </p>
          <p className="text-lg font-bold text-casa-600 dark:text-casa-400">
            {formatPriceFull(listing.price)}
          </p>
        </div>
      ) : (
        <p
          className="text-base font-semibold text-slate-900 dark:text-white"
          style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}
        >
          Listing added!
        </p>
      )}
    </>
  );
}

function ErrorState({
  message,
  onRetry,
  onClose,
}: {
  message?: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" className="fill-red-500">
          <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>
      </div>

      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
        Something went wrong
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {message || 'Failed to add listing'}
      </p>

      <div className="flex gap-3 w-full">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          Dismiss
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-casa-600 text-white"
        >
          Try Again
        </button>
      </div>
    </>
  );
}
