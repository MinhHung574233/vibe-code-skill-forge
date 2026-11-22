/// <reference lib="webworker" />
import { cacheNames } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  getCacheKeyForURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

/**
 * Service worker (injectManifest). Replaces the generated worker so the app can ask it two
 * questions that matter on iOS, where Cache Storage can be evicted independently of the page:
 *   GET_PRECACHE_STATUS -> which precached files are missing right now?
 *   REPAIR_PRECACHE     -> re-download exactly the missing ones.
 * Updates never activate by themselves: the page sends SKIP_WAITING after the user agrees.
 */
type ManifestEntry = string | { url: string; revision: string | null };
const sw = self as unknown as ServiceWorkerGlobalScope;

// Workbox replaces the literal text `self.__WB_MANIFEST` at build time; do not alias `self` here.
const manifest = (self as unknown as { __WB_MANIFEST: ManifestEntry[] }).__WB_MANIFEST;
const expectedUrls = manifest.map((entry) => (typeof entry === 'string' ? entry : entry.url));

precacheAndRoute(manifest);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

async function findMissing(): Promise<string[]> {
  const cache = await caches.open(cacheNames.precache);
  const missing: string[] = [];
  for (const url of expectedUrls) {
    const key = getCacheKeyForURL(url);
    if (!key || !(await cache.match(key))) missing.push(url);
  }
  return missing;
}

async function repairMissing(): Promise<{ repaired: number; failed: string[] }> {
  const cache = await caches.open(cacheNames.precache);
  let repaired = 0;
  const failed: string[] = [];
  for (const url of await findMissing()) {
    try {
      const key = getCacheKeyForURL(url);
      const response = await fetch(url, { cache: 'reload' });
      if (!key || !response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(key, response);
      repaired += 1;
    } catch {
      failed.push(url);
    }
  }
  return { repaired, failed };
}

type Message = { type?: string };

sw.addEventListener('message', (event) => {
  const data = event.data as Message | null;
  const port = event.ports[0];

  switch (data?.type) {
    case 'SKIP_WAITING':
      void sw.skipWaiting();
      break;
    case 'GET_PRECACHE_STATUS':
      event.waitUntil(
        findMissing().then((missing) => {
          port?.postMessage({ expected: expectedUrls.length, missing });
        }),
      );
      break;
    case 'REPAIR_PRECACHE':
      event.waitUntil(
        repairMissing().then(async (result) => {
          const missing = await findMissing();
          port?.postMessage({ expected: expectedUrls.length, missing, ...result });
        }),
      );
      break;
    default:
      break;
  }
});
