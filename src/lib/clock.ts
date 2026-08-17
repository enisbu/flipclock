// Time logic: drift free tick and formatting.
// Never a blind setInterval(1000). Every tick computes the remaining time until
// the next boundary from Date and arms a fresh setTimeout for exactly that span.

export type ClockTime = {
	hours: string;
	minutes: string;
	seconds: string;
};

function pad(value: number): string {
	return value.toString().padStart(2, '0');
}

/** Reads the current time as two digit strings. */
export function readTime(use24h: boolean, now: Date = new Date()): ClockTime {
	const rawHours = now.getHours();
	const hours = use24h ? rawHours : rawHours % 12 || 12;
	return {
		hours: pad(hours),
		minutes: pad(now.getMinutes()),
		seconds: pad(now.getSeconds())
	};
}

/** Remaining time of a countdown as two digit strings. 90 minutes stays '90'. */
export function countdownParts(ms: number): { minutes: string; seconds: string } {
	const total = Math.max(0, Math.round(ms / 1000));
	return { minutes: pad(Math.floor(total / 60)), seconds: pad(total % 60) };
}

/** Readable form for screen readers. */
export function spokenTime(time: ClockTime, showSeconds: boolean): string {
	return showSeconds
		? `${time.hours}:${time.minutes}:${time.seconds}`
		: `${time.hours}:${time.minutes}`;
}

/** Tick step in milliseconds: one second while seconds show, otherwise one minute. */
export function tickStep(showSeconds: boolean): number {
	return showSeconds ? 1000 : 60_000;
}

/**
 * Milliseconds until the next full second or minute, plus a 20 ms safety margin
 * so an early timer does not hit the same boundary twice.
 */
export function nextDelay(step: number, now: number = Date.now()): number {
	return step - (now % step) + 20;
}

/**
 * Starts the tick on the next boundary (second or minute, depending on showSeconds).
 * Returns a stop function.
 */
export function startTicking(
	onTick: (time: ClockTime) => void,
	options: { use24h: boolean; showSeconds: boolean }
): () => void {
	const step = tickStep(options.showSeconds);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function schedule() {
		timer = setTimeout(() => {
			onTick(readTime(options.use24h));
			schedule();
		}, nextDelay(step));
	}

	schedule();
	return () => clearTimeout(timer);
}
