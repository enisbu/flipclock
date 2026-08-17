import { describe, expect, it, vi } from 'vitest';
import { CURRENT_VERSION, DEFAULTS, loadSettings, migrate } from './settings.svelte';

describe('migrate', () => {
	it('carries an unversioned object forward to the current version', () => {
		const result = migrate({ use24h: false, showSeconds: true });
		expect(result.version).toBe(CURRENT_VERSION);
		expect(result.use24h).toBe(false);
		expect(result.showSeconds).toBe(true);
	});

	it('fills a missing key with the current default rather than undefined', () => {
		const result = migrate({ version: 0, use24h: false });
		expect(result.showDate).toBe(DEFAULTS.showDate);
		expect(result.theme).toBe(DEFAULTS.theme);
		expect(result.brightness).toBe(DEFAULTS.brightness);
		// The stored value still wins over the default.
		expect(result.use24h).toBe(false);
	});

	it('rejects an unknown theme and falls back to the default', () => {
		expect(migrate({ version: 1, theme: 'neon-hologram' }).theme).toBe(DEFAULTS.theme);
	});

	it('clamps a brightness outside the allowed range', () => {
		expect(migrate({ version: 1, brightness: 9 }).brightness).toBe(1);
		expect(migrate({ version: 1, brightness: -4 }).brightness).toBe(0.2);
		expect(migrate({ version: 1, brightness: 'bright' }).brightness).toBe(DEFAULTS.brightness);
	});

	it('ignores a wrongly typed boolean', () => {
		expect(migrate({ version: 1, use24h: 'yes' }).use24h).toBe(DEFAULTS.use24h);
	});

	it('falls back to defaults for a non object payload', () => {
		expect(migrate(null)).toEqual(DEFAULTS);
		expect(migrate('nonsense')).toEqual(DEFAULTS);
		expect(migrate([1, 2, 3])).toEqual(DEFAULTS);
	});

	it('does not throw on a future version it cannot migrate', () => {
		const result = migrate({ version: 99, use24h: false });
		expect(result.version).toBe(CURRENT_VERSION);
		expect(result.use24h).toBe(false);
	});

	it('marks the hint as seen for an existing install, which is not a first run', () => {
		// Anything already stored predates the hint, so showing it would be noise.
		expect(migrate({ version: 1, theme: 'slate' }).hintSeen).toBe(true);
		expect(migrate({ use24h: false }).hintSeen).toBe(true);
	});

	it('leaves the hint unseen for a fresh install with nothing stored', () => {
		expect(DEFAULTS.hintSeen).toBe(false);
	});

	it('keeps a stored hintSeen of false rather than overwriting it', () => {
		// A viewer who was interrupted mid hint still owns the flag.
		expect(migrate({ version: 2, hintSeen: false }).hintSeen).toBe(false);
	});

	it('carries the migration chain from 0 all the way to the current version', () => {
		const result = migrate({ use24h: false, brightness: 0.5 });
		expect(result.version).toBe(CURRENT_VERSION);
		expect(result.use24h).toBe(false);
		expect(result.brightness).toBe(0.5);
		expect(result.theme).toBe(DEFAULTS.theme);
	});
});

describe('loadSettings', () => {
	it('returns defaults when localStorage is absent, as during prerender', () => {
		// The prerender step runs in Node, where the identifier does not exist at all.
		expect(typeof localStorage).toBe('undefined');
		expect(loadSettings()).toEqual(DEFAULTS);
	});

	it('falls back to defaults on corrupt JSON without throwing', () => {
		const store = new Map<string, string>([['flip-clock-settings', '{ not json at all']]);
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, value)
		});

		expect(() => loadSettings()).not.toThrow();
		expect(loadSettings()).toEqual(DEFAULTS);

		vi.unstubAllGlobals();
	});

	it('reads a stored object back', () => {
		const store = new Map<string, string>([
			['flip-clock-settings', JSON.stringify({ version: 1, theme: 'slate', showSeconds: true })]
		]);
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, value)
		});

		const result = loadSettings();
		expect(result.theme).toBe('slate');
		expect(result.showSeconds).toBe(true);
		expect(result.use24h).toBe(DEFAULTS.use24h);

		vi.unstubAllGlobals();
	});
});
