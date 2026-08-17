// Local first settings. One localStorage key, one JSON object, no server.
// The version lives inside the serialized data so that value and schema version
// are written and read atomically, never as two keys that can drift apart.

const STORAGE_KEY = 'flip-clock-settings';

/** Bump when the stored shape changes, and add the matching migration below. */
export const CURRENT_VERSION = 1;

export const THEMES = ['default', 'warm', 'night', 'slate'] as const;
export type Theme = (typeof THEMES)[number];

export type Settings = {
	version: number;
	use24h: boolean;
	showSeconds: boolean;
	showDate: boolean;
	theme: Theme;
	brightness: number;
};

export const DEFAULTS: Settings = {
	version: CURRENT_VERSION,
	use24h: true,
	showSeconds: false,
	showDate: false,
	theme: 'default',
	brightness: 1
};

/**
 * One entry per version step: the key is the version being upgraded FROM.
 * The table stays in place even while it is nearly empty, because the whole
 * point is that a stored object written today can be read by a later build.
 */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
	// 0 predates the versioned object. Nothing to rename yet, so the payload
	// passes through and only picks up the current defaults below.
	0: (data) => data
};

function clampBrightness(value: unknown): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULTS.brightness;
	return Math.min(1, Math.max(0.2, value));
}

function coerce(data: Record<string, unknown>): Settings {
	// Spread the defaults LAST so a key introduced in a later version arrives with
	// its default instead of undefined. Then validate the values that have a range.
	const merged = { ...DEFAULTS, ...data, version: CURRENT_VERSION };
	const theme = THEMES.includes(merged.theme as Theme) ? (merged.theme as Theme) : DEFAULTS.theme;
	return {
		version: CURRENT_VERSION,
		use24h: typeof merged.use24h === 'boolean' ? merged.use24h : DEFAULTS.use24h,
		showSeconds: typeof merged.showSeconds === 'boolean' ? merged.showSeconds : DEFAULTS.showSeconds,
		showDate: typeof merged.showDate === 'boolean' ? merged.showDate : DEFAULTS.showDate,
		theme,
		brightness: clampBrightness(merged.brightness)
	};
}

/**
 * Runs the migration chain over a raw parsed object and returns valid settings.
 * Exported so the chain can be tested without touching storage.
 */
export function migrate(raw: unknown): Settings {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...DEFAULTS };

	let data = { ...(raw as Record<string, unknown>) };
	let version = typeof data.version === 'number' ? data.version : 0;

	while (version < CURRENT_VERSION) {
		const step = MIGRATIONS[version];
		if (!step) break;
		data = step(data);
		version += 1;
	}

	return coerce(data);
}

/**
 * Reads settings from storage. Any failure yields the defaults: a bad stored
 * value must never leave the user staring at a blank screen.
 */
export function loadSettings(): Settings {
	// Load bearing guard: prerender = true runs this module in Node, where the
	// identifier localStorage does not exist at all, so a bare try/catch is not enough.
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return { ...DEFAULTS };
		return migrate(JSON.parse(stored));
	} catch {
		return { ...DEFAULTS };
	}
}

function saveSettings(value: Settings): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		// A full or blocked storage must not break the clock.
	}
}

/**
 * Asks the browser to keep the origin's storage across eviction sweeps.
 * Chrome legitimately answers false until the site has earned engagement, so the
 * result is informational only and never gates anything.
 */
export function requestPersistentStorage(): void {
	if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
	void navigator.storage.persist().catch(() => false);
}

/** Reactive settings singleton. Reads once, then writes through on every change. */
class SettingsStore {
	#value = $state<Settings>(loadSettings());

	get use24h() {
		return this.#value.use24h;
	}
	set use24h(next: boolean) {
		this.#value.use24h = next;
	}

	get showSeconds() {
		return this.#value.showSeconds;
	}
	set showSeconds(next: boolean) {
		this.#value.showSeconds = next;
	}

	get showDate() {
		return this.#value.showDate;
	}
	set showDate(next: boolean) {
		this.#value.showDate = next;
	}

	get theme() {
		return this.#value.theme;
	}
	set theme(next: Theme) {
		this.#value.theme = next;
	}

	get brightness() {
		return this.#value.brightness;
	}
	set brightness(next: number) {
		this.#value.brightness = clampBrightness(next);
	}

	/** Snapshot for persistence. */
	get snapshot(): Settings {
		return { ...this.#value };
	}

	/**
	 * Registers the write through effect. Call once from a component.
	 * The first run writes the loaded value straight back, which is harmless.
	 */
	persist(): void {
		$effect(() => {
			saveSettings(this.snapshot);
		});
	}
}

export const settings = new SettingsStore();
