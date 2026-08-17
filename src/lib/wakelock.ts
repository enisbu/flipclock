// Screen Wake Lock: keeps the display awake while the page is visible.
// Android releases the lock on every switch to hidden, hence the re acquire on
// visibilitychange. If the API is missing (older Firefox, Safari), nothing happens.

/**
 * Requests the wake lock and holds it across visibility changes.
 * Returns a cleanup function.
 */
export function keepScreenAwake(): () => void {
	if (!('wakeLock' in navigator)) return () => {};

	let lock: WakeLockSentinel | null = null;
	let disposed = false;

	async function acquire() {
		if (disposed || document.visibilityState !== 'visible') return;
		try {
			lock = await navigator.wakeLock.request('screen');
			lock.addEventListener('release', () => {
				lock = null;
			});
		} catch {
			// The lock is a request, not a guarantee: battery saver or a missing HTTPS
			// context make it fail. That is no reason to stop the clock.
			lock = null;
		}
	}

	function onVisibility() {
		if (document.visibilityState === 'visible') void acquire();
	}

	document.addEventListener('visibilitychange', onVisibility);
	void acquire();

	return () => {
		disposed = true;
		document.removeEventListener('visibilitychange', onVisibility);
		void lock?.release();
		lock = null;
	};
}
