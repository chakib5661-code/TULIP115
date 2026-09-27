/**
 * PWA Version Manager & Service Worker Registration Helper
 * Safely handles service worker registration, version logging, and updates across browsers and PWA environments.
 */

export const APP_VERSION = '1.1.5';

export function registerPwaServiceWorker(): void {
  if (typeof window === 'undefined') return;

  console.log(`[PWA] Tulip Fragrance Company running version ${APP_VERSION}`);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.update().catch(() => {});
          }
        })
        .catch(() => {});
    });
  }
}

export function unregisterPwaServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.getRegistrations().then((registrations) => {
    const unregisterPromises = registrations.map((r) => r.unregister());
    return Promise.all(unregisterPromises).then(() => true);
  });
}

export default {
  APP_VERSION,
  registerPwaServiceWorker,
  unregisterPwaServiceWorker,
};
