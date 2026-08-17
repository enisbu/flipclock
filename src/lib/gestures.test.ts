import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGestures, type GestureOptions } from './gestures';

function setup(overrides: Partial<GestureOptions> = {}) {
	const onLongPress = vi.fn();
	const onSwipeUp = vi.fn();
	const gestures = createGestures({
		longPressMs: 600,
		moveTolerancePx: 10,
		swipeUpPx: 64,
		onLongPress,
		onSwipeUp,
		...overrides
	});
	return { gestures, onLongPress, onSwipeUp };
}

afterEach(() => {
	vi.useRealTimers();
});

describe('long press', () => {
	it('fires once the pointer has rested long enough', () => {
		vi.useFakeTimers();
		const { gestures, onLongPress } = setup();

		gestures.down({ x: 100, y: 100 });
		vi.advanceTimersByTime(599);
		expect(onLongPress).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(gestures.consumeHandled()).toBe(true);
	});

	it('does not fire when the pointer drifts past the tolerance', () => {
		vi.useFakeTimers();
		const { gestures, onLongPress } = setup();

		gestures.down({ x: 100, y: 100 });
		gestures.move({ x: 111, y: 100 });
		vi.advanceTimersByTime(1000);

		expect(onLongPress).not.toHaveBeenCalled();
		expect(gestures.consumeHandled()).toBe(true);
	});

	it('keeps resting while the pointer stays inside the tolerance', () => {
		vi.useFakeTimers();
		const { gestures, onLongPress } = setup();

		gestures.down({ x: 100, y: 100 });
		gestures.move({ x: 108, y: 92 });
		vi.advanceTimersByTime(600);

		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	it('does not fire after the pointer lifts', () => {
		vi.useFakeTimers();
		const { gestures, onLongPress } = setup();

		gestures.down({ x: 100, y: 100 });
		gestures.end();
		vi.advanceTimersByTime(1000);

		expect(onLongPress).not.toHaveBeenCalled();
		expect(gestures.consumeHandled()).toBe(false);
	});
});

describe('swipe up', () => {
	it('fires past the threshold and only once per press', () => {
		const { gestures, onSwipeUp } = setup();

		gestures.down({ x: 100, y: 300 });
		gestures.move({ x: 100, y: 235 });
		gestures.move({ x: 100, y: 150 });

		expect(onSwipeUp).toHaveBeenCalledTimes(1);
	});

	it('ignores a drag that is mostly sideways', () => {
		const { gestures, onSwipeUp } = setup();

		gestures.down({ x: 100, y: 300 });
		gestures.move({ x: 300, y: 230 });

		expect(onSwipeUp).not.toHaveBeenCalled();
	});

	it('ignores a downward drag', () => {
		const { gestures, onSwipeUp } = setup();

		gestures.down({ x: 100, y: 100 });
		gestures.move({ x: 100, y: 300 });

		expect(onSwipeUp).not.toHaveBeenCalled();
	});

	it('cancels a pending long press', () => {
		vi.useFakeTimers();
		const { gestures, onLongPress, onSwipeUp } = setup();

		gestures.down({ x: 100, y: 300 });
		gestures.move({ x: 100, y: 200 });
		vi.advanceTimersByTime(1000);

		expect(onSwipeUp).toHaveBeenCalledTimes(1);
		expect(onLongPress).not.toHaveBeenCalled();
	});
});

describe('consumeHandled', () => {
	it('reports a clean tap and clears itself after a gesture', () => {
		vi.useFakeTimers();
		const { gestures } = setup();

		gestures.down({ x: 100, y: 100 });
		gestures.end();
		expect(gestures.consumeHandled()).toBe(false);

		gestures.down({ x: 100, y: 100 });
		vi.advanceTimersByTime(600);
		expect(gestures.consumeHandled()).toBe(true);
		expect(gestures.consumeHandled()).toBe(false);
	});
});
