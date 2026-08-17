// Screen Wake Lock: hält das Display wach, solange die Seite sichtbar ist.
// Android gibt den Lock bei jedem Wechsel nach hidden frei, darum das Re-Acquire
// auf visibilitychange. Fehlt die API (Firefox älter, Safari), passiert nichts.

/**
 * Fordert den Wake Lock an und hält ihn über Sichtbarkeitswechsel hinweg.
 * Gibt eine Aufräum-Funktion zurück.
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
			// Der Lock ist eine Bitte, keine Garantie: Energiesparmodus oder fehlendes
			// HTTPS lassen ihn scheitern. Kein Grund, die Uhr zu stoppen.
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
