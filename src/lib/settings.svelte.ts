import { PersistedState } from 'runed';

const STORAGE_KEY = 'flip-clock-settings';

/** Bump when the stored shape changes, and add the matching migration below. */
export const CURRENT_VERSION = 3;

export const THEMES = ['default', 'warm', 'night', 'slate'] as const;
export type Theme = (typeof THEMES)[number];

export const FACES = ['clock', 'focus'] as const;
export type Face = (typeof FACES)[number];

/** What the line under the clock shows. */
export const SUBLINES = ['off', 'date', 'text'] as const;
export type Subline = (typeof SUBLINES)[number];

/** Focus durations on offer, in minutes. No free input: presets keep it one tap. */
export const FOCUS_PRESETS = [15, 25, 50, 90] as const;

export type Settings = {
	version: number;
	use24h: boolean;
	showSeconds: boolean;
	subline: Subline;
	sublineText: string;
	face: Face;
	focusMinutes: number;
	theme: Theme;
	brightness: number;
	hintSeen: boolean;
};

export const DEFAULTS: Settings = {
	version: CURRENT_VERSION,
	use24h: true,
	showSeconds: false,
	subline: 'off',
	sublineText: '',
	face: 'clock',
	focusMinutes: 25,
	theme: 'default',
	brightness: 1,
	hintSeen: false
};

const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
	0: (data) => data,
	1: (data) => ({ ...data, hintSeen: true }),
	2: (data) => ({ ...data, subline: data.showDate === true ? 'date' : 'off' })
};

function clamp(value: unknown, min: number, max: number, fallback: number): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}

function clampBrightness(value: unknown): number {
	return clamp(value, 0.2, 1, DEFAULTS.brightness);
}

function clampFocusMinutes(value: unknown): number {
	return Math.round(clamp(value, 1, 180, DEFAULTS.focusMinutes));
}

function coerce(data: Record<string, unknown>): Settings {
	const merged = { ...DEFAULTS, ...data, version: CURRENT_VERSION };
	const theme = THEMES.includes(merged.theme as Theme) ? (merged.theme as Theme) : DEFAULTS.theme;
	const subline = SUBLINES.includes(merged.subline as Subline)
		? (merged.subline as Subline)
		: DEFAULTS.subline;
	const face = FACES.includes(merged.face as Face) ? (merged.face as Face) : DEFAULTS.face;
	return {
		version: CURRENT_VERSION,
		use24h: typeof merged.use24h === 'boolean' ? merged.use24h : DEFAULTS.use24h,
		showSeconds: typeof merged.showSeconds === 'boolean' ? merged.showSeconds : DEFAULTS.showSeconds,
		subline,
		sublineText:
			typeof merged.sublineText === 'string' ? merged.sublineText.slice(0, 60) : DEFAULTS.sublineText,
		face,
		focusMinutes: clampFocusMinutes(merged.focusMinutes),
		theme,
		brightness: clampBrightness(merged.brightness),
		hintSeen: typeof merged.hintSeen === 'boolean' ? merged.hintSeen : DEFAULTS.hintSeen
	};
}

/** Runs the migration chain over a raw parsed object and returns valid settings. */
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

/** Reads settings from storage, falling back to defaults on any failure. */
export function loadSettings(): Settings {
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return { ...DEFAULTS };
		return migrate(JSON.parse(stored));
	} catch {
		return { ...DEFAULTS };
	}
}

/** Asks the browser to keep the origin's storage across eviction sweeps. */
export function requestPersistentStorage(): void {
	if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
	void navigator.storage.persist().catch(() => false);
}

/* Writes land in the buffer first and reach storage once the burst is over. The
   brightness slider fires on every frame of a drag, and every write serializes the
   whole settings object into localStorage. */
const PERSIST_DELAY_MS = 250;

/** Fields that constrain what a caller may write. Everything else is stored as given. */
const COERCE: { [K in keyof Settings]?: (value: Settings[K]) => Settings[K] } = {
	sublineText: (value) => value.slice(0, 60),
	focusMinutes: clampFocusMinutes,
	brightness: clampBrightness
};

/** Everything a caller may read and write. The version is the store's own business. */
const FIELDS = (Object.keys(DEFAULTS) as (keyof Settings)[]).filter((key) => key !== 'version');

class SettingsStore {
	#store = new PersistedState<Settings>(STORAGE_KEY, loadSettings(), {
		serializer: {
			serialize: JSON.stringify,
			deserialize: (raw) => migrate(JSON.parse(raw))
		}
	});

	/* Read through one derived, never through #store.current per property: that getter
	   hits localStorage and runs the whole parse, migrate and coerce chain on every
	   single read, and the clock face reads six to eight fields per tick. */
	#value = $derived(this.#store.current);
	#pending = $state<Partial<Settings>>({});
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor() {
		for (const field of FIELDS) {
			Object.defineProperty(this, field, {
				get: () => this.#pending[field] ?? this.#value[field],
				set: (next) => this.#write(field, next),
				enumerable: true
			});
		}

		// A buffered write must not die with the tab.
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') this.#commit();
			});
			window.addEventListener('pagehide', () => this.#commit());
		}
	}

	#write<K extends keyof Settings>(field: K, next: Settings[K]) {
		const coerce = COERCE[field] as ((value: Settings[K]) => Settings[K]) | undefined;
		this.#pending[field] = coerce ? coerce(next) : next;
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.#commit(), PERSIST_DELAY_MS);
	}

	#commit() {
		clearTimeout(this.#timer);
		const pending = this.#pending;
		if (Object.keys(pending).length === 0) return;
		this.#pending = {};
		this.#store.current = { ...this.#value, ...pending };
	}
}

/* The fields are defined in the constructor, so the class itself carries none of them. */
type Settable = Omit<Settings, 'version'>;

export const settings = new SettingsStore() as SettingsStore & Settable;
