import { IsDocumentVisible } from 'runed';

/**
 * Holds the screen wake lock while the document is visible. The browser drops the
 * lock whenever the tab goes away, so it is taken again on every return.
 */
export function keepScreenAwake(): void {
	const visible = new IsDocumentVisible();

	$effect(() => {
		if (!visible.current || !('wakeLock' in navigator)) return;

		let lock: WakeLockSentinel | null = null;
		let released = false;

		navigator.wakeLock
			.request('screen')
			.then((next) => {
				if (released) void next.release();
				else lock = next;
			})
			.catch(() => {});

		return () => {
			released = true;
			void lock?.release();
		};
	});
}
