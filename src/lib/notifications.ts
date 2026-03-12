// Browser Notification helpers for Casa

const SW_PATH = '/sw.js';

/** Register the service worker (idempotent) */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch {
    return null;
  }
}

/** Check if notifications are supported */
export function notificationsSupported(): boolean {
  return 'Notification' in window;
}

/** Request notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Get current permission state */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/** Show a notification via the service worker (persists when app is backgrounded) */
export async function showNotification(
  title: string,
  options?: { body?: string; url?: string }
) {
  // Try service worker notification first (works when app is backgrounded)
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      await reg.showNotification(title, {
        body: options?.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'casa-update',
        data: { url: options?.url || '/' },
      });
      return;
    }
  }

  // Fallback to basic Notification API
  if (notificationsSupported() && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body: options?.body,
      icon: '/favicon.svg',
    });
    if (options?.url) {
      n.onclick = () => {
        window.focus();
        window.location.href = options.url!;
      };
    }
  }
}

/** Key for tracking known listing IDs in localStorage */
const KNOWN_LISTINGS_KEY = 'casa_known_listings';

/** Get the set of listing IDs the user has already seen */
export function getKnownListingIds(): Set<string> {
  try {
    const stored = localStorage.getItem(KNOWN_LISTINGS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

/** Save the current set of known listing IDs */
export function setKnownListingIds(ids: Set<string>) {
  localStorage.setItem(KNOWN_LISTINGS_KEY, JSON.stringify([...ids]));
}

/** Key for tracking known note counts per listing */
const KNOWN_NOTES_KEY = 'casa_known_notes';

/** Get the map of listing ID -> note count */
export function getKnownNoteCounts(): Record<string, number> {
  try {
    const stored = localStorage.getItem(KNOWN_NOTES_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/** Save known note counts */
export function setKnownNoteCounts(counts: Record<string, number>) {
  localStorage.setItem(KNOWN_NOTES_KEY, JSON.stringify(counts));
}
