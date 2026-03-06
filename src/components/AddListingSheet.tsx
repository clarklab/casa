import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useAuth } from '@/hooks/useAuth';
import { NAME_OPTIONS } from '@/lib/constants';

interface AddListingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; addedBy: string; passcode: string }) => void;
}

export function AddListingSheet({ isOpen, onClose, onSubmit }: AddListingSheetProps) {
  const { getLastName, setLastName, getPasscode } = useAuth();
  const [url, setUrl] = useState('');
  const [name, setName] = useState(getLastName() || NAME_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  const selectedName = name === 'Other' ? customName : name;

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('Please paste a listing URL');
      return;
    }
    if (!selectedName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setLastName(name);

    const data = {
      url: url.trim(),
      addedBy: selectedName.trim(),
      passcode: getPasscode(),
    };

    setUrl('');
    onClose();
    onSubmit(data);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add a Home">
      <div className="space-y-5 pt-2">
        {/* URL input */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
            Paste listing URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://redfin.com/..."
            autoFocus
            className="w-full px-3.5 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-casa-500"
          />
        </div>

        {/* Name chips */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
            Your name
          </label>
          <div className="flex flex-wrap gap-2">
            {[...NAME_OPTIONS, 'Other' as const].map((n) => (
              <button
                key={n}
                onClick={() => setName(n)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  name === n
                    ? 'bg-casa-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {name === 'Other' && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your name"
              className="w-full mt-2 px-3.5 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-casa-500"
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-casa-600 hover:bg-casa-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
        >
          Add Home
        </button>
      </div>
    </BottomSheet>
  );
}
