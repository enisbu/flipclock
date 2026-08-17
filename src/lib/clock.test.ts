import { describe, expect, it, vi, afterEach } from 'vitest';
import { countdownParts, nextDelay, readTime, spokenTime, startTicking, tickStep } from './clock';

describe('readTime', () => {
	it('pads every field to two digits', () => {
		const time = readTime(true, new Date(2026, 0, 5, 7, 8, 9));
		expect(time).toEqual({ hours: '07', minutes: '08', seconds: '09' });
	});

	it('keeps the raw hour in 24 hour mode', () => {
		expect(readTime(true, new Date(2026, 0, 5, 0, 0, 0)).hours).toBe('00');
		expect(readTime(true, new Date(2026, 0, 5, 13, 0, 0)).hours).toBe('13');
		expect(readTime(true, new Date(2026, 0, 5, 23, 0, 0)).hours).toBe('23');
	});

	it('maps the 12 hour boundaries', () => {
		// Midnight becomes 12, not 00, and afternoon hours wrap back to 01.
		expect(readTime(false, new Date(2026, 0, 5, 0, 30, 0)).hours).toBe('12');
		expect(readTime(false, new Date(2026, 0, 5, 12, 30, 0)).hours).toBe('12');
		expect(readTime(false, new Date(2026, 0, 5, 13, 30, 0)).hours).toBe('01');
		expect(readTime(false, new Date(2026, 0, 5, 23, 30, 0)).hours).toBe('11');
	});
});

describe('spokenTime', () => {
	const time = { hours: '09', minutes: '05', seconds: '03' };

	it('omits seconds when they are hidden', () => {
		expect(spokenTime(time, false)).toBe('09:05');
	});

	it('includes seconds when they are shown', () => {
		expect(spokenTime(time, true)).toBe('09:05:03');
	});
});

describe('tickStep', () => {
	it('uses one second with seconds and one minute without', () => {
		expect(tickStep(true)).toBe(1000);
		expect(tickStep(false)).toBe(60_000);
	});
});

describe('nextDelay', () => {
	it('lands on the next boundary instead of a fixed step', () => {
		// 300 ms into the second, so 700 ms remain, plus the 20 ms margin.
		expect(nextDelay(1000, 10_000_300)).toBe(720);
		// 42 s into the minute leaves 18 s.
		expect(nextDelay(60_000, 42_000)).toBe(18_020);
	});

	it('never returns a full step at a fractional offset', () => {
		for (const offset of [1, 137, 499, 999]) {
			expect(nextDelay(1000, offset)).toBeLessThan(1000 + 20);
		}
	});

	it('yields a full step plus margin exactly on a boundary', () => {
		expect(nextDelay(1000, 5000)).toBe(1020);
	});
});

describe('startTicking', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('schedules from the recomputed boundary, not a constant', () => {
		vi.useFakeTimers();
		// An arbitrary offset inside the second: 250 ms elapsed, 750 ms to go.
		vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0, 250));
		const spy = vi.spyOn(globalThis, 'setTimeout');

		const stop = startTicking(() => {}, { use24h: true, showSeconds: true });
		expect(spy.mock.calls[0][1]).toBe(770);

		// After firing, the next delay is recomputed from the clock rather than reused.
		// The timer fired 20 ms past the boundary, so 980 ms remain, plus the margin.
		vi.advanceTimersByTime(770);
		expect(spy.mock.calls[1][1]).toBe(1000);

		stop();
		spy.mockRestore();
	});

	it('ticks on the minute when seconds are hidden', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 42, 0));
		const spy = vi.spyOn(globalThis, 'setTimeout');

		const stop = startTicking(() => {}, { use24h: true, showSeconds: false });
		// 42 s into the minute leaves 18 s, so this is not a blind 60000.
		expect(spy.mock.calls[0][1]).toBe(18_020);

		stop();
		spy.mockRestore();
	});

	it('stops cleanly and leaves no orphaned timer', () => {
		vi.useFakeTimers();
		// Start exactly on a boundary so the first tick is due after 1020 ms.
		vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0, 0));
		const onTick = vi.fn();
		const stop = startTicking(onTick, { use24h: true, showSeconds: true });

		vi.advanceTimersByTime(1100);
		expect(onTick).toHaveBeenCalledTimes(1);

		stop();
		vi.advanceTimersByTime(10_000);
		expect(onTick).toHaveBeenCalledTimes(1);
	});
});

describe('countdownParts', () => {
	it('formats a countdown as two digit strings and keeps long minutes intact', () => {
		expect(countdownParts(25 * 60_000)).toEqual({ minutes: '25', seconds: '00' });
		expect(countdownParts(90 * 60_000)).toEqual({ minutes: '90', seconds: '00' });
		expect(countdownParts(61_000)).toEqual({ minutes: '01', seconds: '01' });
	});

	it('never goes below zero', () => {
		expect(countdownParts(0)).toEqual({ minutes: '00', seconds: '00' });
		expect(countdownParts(-5000)).toEqual({ minutes: '00', seconds: '00' });
	});
});
