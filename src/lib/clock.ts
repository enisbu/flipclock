// Zeitlogik: driftfreier Tick und Formatierung.
// Kein setInterval(1000) blind, sondern jeder Tick berechnet aus Date die Restzeit
// bis zur nächsten Grenze und setzt dafür ein frisches setTimeout.

/** 24-Stunden-Format, feste Vorgabe. Es gibt bewusst keine UI dafür. */
export const HOUR_24 = true;

/** Sekunden-Karte. Standard aus, sie stört den ruhigen Look. */
export const SHOW_SECONDS = false;

export type ClockTime = {
	hours: string;
	minutes: string;
	seconds: string;
};

function pad(value: number): string {
	return value.toString().padStart(2, '0');
}

/** Liest die aktuelle Uhrzeit als zweistellige Strings. */
export function readTime(now: Date = new Date()): ClockTime {
	const rawHours = now.getHours();
	const hours = HOUR_24 ? rawHours : rawHours % 12 || 12;
	return {
		hours: pad(hours),
		minutes: pad(now.getMinutes()),
		seconds: pad(now.getSeconds())
	};
}

/** Vorlesbare Fassung für Screenreader. */
export function spokenTime(time: ClockTime): string {
	return SHOW_SECONDS
		? `${time.hours}:${time.minutes}:${time.seconds} Uhr`
		: `${time.hours}:${time.minutes} Uhr`;
}

/**
 * Startet den Tick auf der nächsten Grenze (Sekunde oder Minute, je nach SHOW_SECONDS).
 * Gibt eine Stopp-Funktion zurück.
 */
export function startTicking(onTick: (time: ClockTime) => void): () => void {
	const step = SHOW_SECONDS ? 1000 : 60_000;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function schedule() {
		const now = Date.now();
		// Rest bis zur nächsten vollen Sekunde bzw. Minute, plus 20 ms Sicherheitsabstand,
		// damit ein früher Wecker nicht dieselbe Grenze zweimal trifft.
		const wait = step - (now % step) + 20;
		timer = setTimeout(() => {
			onTick(readTime());
			schedule();
		}, wait);
	}

	schedule();
	return () => clearTimeout(timer);
}
