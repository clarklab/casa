import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useNotificationWatcher } from '@/hooks/useNotificationWatcher';
import { InstallModal } from '@/components/InstallModal';
import {
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/notifications';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const stored = localStorage.getItem('casa_auth');
    if (!stored) throw redirect({ to: '/' });
    try {
      const { expiry } = JSON.parse(stored);
      if (Date.now() >= expiry) {
        localStorage.removeItem('casa_auth');
        throw redirect({ to: '/' });
      }
    } catch (e) {
      if (e instanceof Response || (e && typeof e === 'object' && 'to' in e)) throw e;
      localStorage.removeItem('casa_auth');
      throw redirect({ to: '/' });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const installPrompt = useInstallPrompt();

  // Register service worker and auto-request notification permission
  useEffect(() => {
    registerServiceWorker();

    // If user hasn't been asked yet, request permission after a brief delay
    const timer = setTimeout(() => {
      if (getNotificationPermission() === 'default') {
        requestNotificationPermission();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Watch for new listings/notes and fire notifications
  useNotificationWatcher();

  return (
    <>
      <Outlet />
      <InstallModal
        isOpen={installPrompt.showModal}
        canInstall={installPrompt.canInstall}
        onInstall={installPrompt.install}
        onDismiss={installPrompt.dismiss}
        onEnableNotifications={() => requestNotificationPermission()}
      />
    </>
  );
}
