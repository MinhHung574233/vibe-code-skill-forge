import { registerSW } from 'virtual:pwa-register';
import { usePwaStore } from './pwaStore';

/** Minimum gap between update checks triggered by the app returning to the foreground. */
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
/** Give the first install time to finish precaching before self-checking. */
const FIRST_READINESS_CHECK_DELAY_MS = 3000;

/**
 * Registers the service worker.
 *
 * iOS standalone apps are suspended and resumed rather than relaunched, and there is no
 * reload button, so on every return to the foreground we (a) look for a new version
 * (throttled) and (b) re-verify the precache, because iOS may have evicted it meanwhile.
 * New workers wait (registerType: 'prompt') until the user applies the update.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const store = usePwaStore.getState();

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      usePwaStore.setState({ needRefresh: true });
    },
    onOfflineReady() {
      usePwaStore.setState({ offlineReady: true });
      void store.checkReadiness();
    },
    onRegisteredSW(_url, registration) {
      setTimeout(
        () => void usePwaStore.getState().checkReadiness(),
        FIRST_READINESS_CHECK_DELAY_MS,
      );
      if (!registration) return;
      let lastUpdateCheck = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        void usePwaStore.getState().checkReadiness();
        if (Date.now() - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) return;
        lastUpdateCheck = Date.now();
        registration.update().catch(() => {
          /* offline: nothing to update */
        });
      });
    },
  });

  usePwaStore.setState({ applyUpdate: () => updateSW(true) });
}
