// Service Worker registration for push notifications.
// The Service Worker itself is a tiny file at /sw.js that handles push events
// from the browser's Push Service. To enable real Web Push (server-driven push
// across devices), you'll need to:
//   1. Generate VAPID keys (`npx web-push generate-vapid-keys`)
//   2. Subscribe the user's browser via pushManager.subscribe
//   3. Send pushes from your backend (e.g. Supabase Edge Function)
// See README for the full setup.

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  // Skip in dev (Vite dev server) to avoid stale-cache headaches
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    // Scope matches the base path the app is served from.
    // For GitHub Pages (base: '/flow/'), the SW must be at /flow/sw.js
    // with scope /flow/. import.meta.env.BASE_URL ends with a slash.
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[flow] service worker registration failed', err);
      });
  });
}
