/**
 * PWA Version Manager & Service Worker Registration Helper
 * Safely handles service worker registration and updates across browsers and PWA environments.
 */

export function registerPwaServiceWorker(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // If service worker is registered via vite-plugin-pwa, let it handle autoUpdate.
      // Otherwise, gracefully handle any legacy registrations.
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
  registerPwaServiceWorker,
  unregisterPwaServiceWorker,
};
