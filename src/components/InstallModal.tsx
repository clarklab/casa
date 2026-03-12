import { useEffect } from 'react';
import {
  notificationsSupported,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/notifications';

interface InstallModalProps {
  isOpen: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onEnableNotifications?: () => void;
}

export function InstallModal({
  isOpen,
  canInstall,
  onInstall,
  onDismiss,
  onEnableNotifications,
}: InstallModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const permissionState = getNotificationPermission();
  const showNotifButton =
    notificationsSupported() && permissionState === 'default';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        className="relative mx-4 mb-4 sm:mb-0 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header illustration */}
        <div className="bg-gradient-to-br from-casa-500 to-casa-700 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 -960 960 960"
              width="36"
              className="fill-white"
            >
              <path d="M80-200v-360l160-160h40v-80h80v80h360l160 160v360H80Zm560-80h160v-247l-80-80-80 80v247Zm-480 0h400v-200H160v200Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Install Casa</h2>
          <p className="text-sm text-white/80">
            Get the full app experience
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-casa-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_active
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Instant notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Know right away when someone adds a new house or note
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-casa-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              phone_iphone
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Home screen app
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Launch Casa like a native app — no browser chrome
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-casa-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Fast &amp; focused
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full screen experience with no distractions
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2.5">
          {canInstall ? (
            <button
              onClick={onInstall}
              className="w-full py-3.5 bg-casa-600 hover:bg-casa-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Install Casa
            </button>
          ) : showNotifButton ? (
            <button
              onClick={async () => {
                await requestNotificationPermission();
                onEnableNotifications?.();
                onDismiss();
              }}
              className="w-full py-3.5 bg-casa-600 hover:bg-casa-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Enable Notifications
            </button>
          ) : null}

          {!canInstall && !showNotifButton ? (
            // iOS or unsupported — show manual instructions
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tap the <strong>Share</strong> button in your browser, then select <strong>"Add to Home Screen"</strong>
              </p>
            </div>
          ) : null}

          <button
            onClick={onDismiss}
            className="w-full py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
