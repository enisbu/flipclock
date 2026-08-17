/// <reference no-default-lib="true"/>
/// <reference lib="webworker"/>
/// <reference types="@sveltejs/kit"/>

// Offline shell. After the first load the clock never needs the network again,
// which is the whole promise of the app: it has to keep working in airplane mode.
// Verify against a production build, since build and files are empty under vite dev.

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `flip-clock-${version}`;
const ASSETS = [...build, ...files];

/**
 * The prerendered shell. It appears in neither build nor files, so without
 * caching it explicitly a cold offline reload would find no document at all and
 * the clock would not render. That is the one failure the app cannot afford.
 */
const SHELL = '/';

sw.addEventListener('install', (event) => {
	// No skipWaiting on purpose. A clock that reloads itself while someone glances
	// at it is worse than one running yesterday's build. The new worker waits until
	// the tab is closed and reopened.
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...ASSETS, SHELL])));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.protocol.startsWith('http') === false) return;

	const isAsset = url.origin === location.origin && ASSETS.includes(url.pathname);

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Cache first for the build output: it is versioned and cannot go stale.
			if (isAsset) {
				const cached = await cache.match(request);
				if (cached) return cached;
			}

			// One route, one shell: any navigation can be answered from the cache,
			// which is what makes a reload in airplane mode still show the clock.
			if (request.mode === 'navigate') {
				const cached = await cache.match(SHELL);
				if (cached) return cached;
			}

			try {
				const response = await fetch(request);
				// Only successful basic responses are worth keeping. An opaque or error
				// response in the cache would resurface as a broken page offline.
				if (response.ok && response.status === 200 && url.origin === location.origin) {
					cache.put(request, response.clone());
				}
				return response;
			} catch {
				// Offline: fall back to whatever is cached, otherwise the prerendered
				// shell, so a reload with no network still renders the clock.
				const cached = (await cache.match(request)) ?? (await cache.match(SHELL));
				if (cached) return cached;
				// Never let a failed fetch escape as an unhandled rejection.
				return new Response('Offline', { status: 503, statusText: 'Offline' });
			}
		})()
	);
});
