import { useCallback } from 'react';
import { AUTH_EXPIRY_DAYS } from '@/lib/constants';

const AUTH_KEY = 'casa_auth';
const NAME_KEY = 'casa_last_name';

export function useAuth() {
  const isAuthenticated = useCallback((): boolean => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return false;
    try {
      const { expiry } = JSON.parse(stored);
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }, []);

  const getPasscode = useCallback((): string => {
    return import.meta.env.VITE_PASSCODE || '1234';
  }, []);

  const getLastName = useCallback((): string => {
    return localStorage.getItem(NAME_KEY) || '';
  }, []);

  const setLastName = useCallback((name: string) => {
    localStorage.setItem(NAME_KEY, name);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return { isAuthenticated, getPasscode, getLastName, setLastName, logout };
}
