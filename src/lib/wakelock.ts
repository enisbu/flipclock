/** Requests the wake lock and holds it across visibility changes, returning a cleanup function. */
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
