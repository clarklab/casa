import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'casa_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Check if the app is already installed (standalone mode) */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user previously dismissed the modal
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - Number(dismissedAt);
        if (elapsed < DISMISS_DURATION_MS) return;
        localStorage.removeItem(DISMISSED_KEY);
      }

      // Show the modal after a short delay so it doesn't interrupt page load
      setTimeout(() => setShowModal(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect when the app gets installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowModal(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowModal(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowModal(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  return {
    /** Whether the browser install prompt is available */
    canInstall: deferredPrompt !== null,
    /** Whether the app is already installed */
    isInstalled,
    /** Whether the install modal should be shown */
    showModal,
    /** Trigger the browser install prompt */
    install,
    /** Dismiss the modal (hides for 7 days) */
    dismiss,
    /** Manually show the modal */
    openModal: () => setShowModal(true),
  };
}
