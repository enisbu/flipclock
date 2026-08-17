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

function clampBrightness(value: unknown): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULTS.brightness;
	return Math.min(1, Math.max(0.2, value));
}

function clampFocusMinutes(value: unknown): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULTS.focusMinutes;
	return Math.min(180, Math.max(1, Math.round(value)));
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

class SettingsStore {
	#store = new PersistedState<Settings>(STORAGE_KEY, loadSettings(), {
		serializer: {
			serialize: JSON.stringify,
			deserialize: (raw) => migrate(JSON.parse(raw))
		}
	});

	get use24h() {
		return this.#store.current.use24h;
	}
	set use24h(next: boolean) {
		this.#store.current.use24h = next;
	}

	get showSeconds() {
		return this.#store.current.showSeconds;
	}
	set showSeconds(next: boolean) {
		this.#store.current.showSeconds = next;
	}

	get subline() {
		return this.#store.current.subline;
	}
	set subline(next: Subline) {
		this.#store.current.subline = next;
	}

	get sublineText() {
		return this.#store.current.sublineText;
	}
	set sublineText(next: string) {
		this.#store.current.sublineText = next.slice(0, 60);
	}

	get face() {
		return this.#store.current.face;
	}
	set face(next: Face) {
		this.#store.current.face = next;
	}

	get focusMinutes() {
		return this.#store.current.focusMinutes;
	}
	set focusMinutes(next: number) {
		this.#store.current.focusMinutes = clampFocusMinutes(next);
	}

	get theme() {
		return this.#store.current.theme;
	}
	set theme(next: Theme) {
		this.#store.current.theme = next;
	}

	get brightness() {
		return this.#store.current.brightness;
	}
	set brightness(next: number) {
		this.#store.current.brightness = clampBrightness(next);
	}

	get hintSeen() {
		return this.#store.current.hintSeen;
	}
	set hintSeen(next: boolean) {
		this.#store.current.hintSeen = next;
	}

}

export const settings = new SettingsStore();
