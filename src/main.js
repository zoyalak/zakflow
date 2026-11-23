import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { startApp } from './ui/app.js';
import { toast } from './ui/toast.js';

startApp();

if ('serviceWorker' in navigator) {
  // The very first install claims the page without a reload; every later
  // update (a new deploy) swaps in and the app reloads itself once.
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    toast('Updating to the latest version…', { duration: 1500 });
    setTimeout(() => window.location.reload(), 900);
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      // Pick up a new deployment while the app stays open, and whenever it
      // comes back to the foreground (the common case on a phone).
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
    onRegisterError(error) {
      console.warn('[zakflow] service worker registration failed', error);
    },
  });
}
