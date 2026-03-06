import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { PASSCODE_LENGTH, AUTH_EXPIRY_DAYS } from '@/lib/constants';
import { Shader, Blob, FilmGrain, Swirl, TiltShift, WaveDistortion } from 'shaders/react';

function isAuthenticated(): boolean {
  const stored = localStorage.getItem('casa_auth');
  if (!stored) return false;
  try {
    const { expiry } = JSON.parse(stored);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

function setAuthenticated() {
  const expiry = Date.now() + AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem('casa_auth', JSON.stringify({ expiry }));
}

export const Route = createFileRoute('/')({
  component: PasscodeGate,
});

function PasscodeGate() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: '/listings' });
    }
  }, [navigate]);

  useEffect(() => {
    if (digits.length === PASSCODE_LENGTH) {
      const code = digits.join('');
      const expected = import.meta.env.VITE_PASSCODE || '1234';
      if (code === expected) {
        setAuthenticated();
        navigate({ to: '/listings' });
      } else {
        setError(true);
        setTimeout(() => {
          setDigits([]);
          setError(false);
        }, 500);
      }
    }
  }, [digits, navigate]);

  const handleDigit = (d: string) => {
    if (digits.length < PASSCODE_LENGTH) {
      setDigits((prev) => [...prev, d]);
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-6">
      {/* Shader background */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Shader style={{ width: '100%', height: '100%' }}>
          <Swirl colorA="#16071f" colorB="#f02b63" colorSpace="oklch" />
          <WaveDistortion angle={237} edges="wrap" frequency={1.4} strength={0.2} transform={{ scale: 1.3 }}>
            <WaveDistortion angle={314} edges="mirror" frequency={10} speed={0.3} waveType="sawtooth">
              <Blob center={{ x: 0.37, y: 0.65 }} deformation={0.7} highlightColor="#ffc61a" highlightX={0.5} size={0.8} softness={1} />
            </WaveDistortion>
          </WaveDistortion>
          <TiltShift angle={155} center={{ x: 0.5, y: 0.45 }} intensity={80} width={0.5} />
          <FilmGrain strength={0.2} />
        </Shader>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2 drop-shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" fill="currentColor"><path d="M80-200v-360l160-160h40v-80h80v80h360l160 160v360H80Zm560-80h160v-247l-80-80-80 80v247Zm-480 0h400v-200H160v200Z"/></svg>
          Casa
        </h1>
        <p className="text-white/70 text-sm mb-10 drop-shadow">Enter passcode</p>

        {/* PIN dots */}
        <div className="flex gap-4 mb-12">
          {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                error
                  ? 'bg-red-500 animate-[shake_0.3s_ease-in-out]'
                  : digits[i]
                    ? 'bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 place-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="h-16 w-16 aspect-square rounded-full text-white/60 text-lg active:bg-white/10 transition-colors"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                className="h-16 w-16 aspect-square rounded-full bg-white/15 backdrop-blur-sm text-white text-2xl font-light active:bg-white/25 transition-colors"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
