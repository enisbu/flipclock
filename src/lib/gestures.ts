export type Point = { x: number; y: number };

export type GestureOptions = {
	/** How long the pointer has to rest before the press counts as long. */
	longPressMs: number;
	/** How far the pointer may drift and still count as resting. */
	moveTolerancePx: number;
	/** How far up the pointer has to travel before the swipe counts. */
	swipeUpPx: number;
	onLongPress: () => void;
	onSwipeUp: () => void;
};

export type Gestures = {
	down(point: Point): void;
	move(point: Point): void;
	end(): void;
	/**
	 * Whether a gesture fired since the last press, which means the click that
	 * follows is the tail of that gesture and not a tap. Reading it clears it.
	 */
	consumeHandled(): boolean;
	cancel(): void;
};

/**
 * Long press and swipe up on one pointer, kept apart from what they trigger.
 * Coordinates go in, callbacks come out, so this runs without a DOM.
 */
export function createGestures(options: GestureOptions): Gestures {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pressOrigin: Point | null = null;
	let swipeOrigin: Point | null = null;
	let handled = false;

	function stopPress() {
		clearTimeout(timer);
		pressOrigin = null;
	}

	return {
		down(point) {
			handled = false;
			pressOrigin = point;
			swipeOrigin = point;
			clearTimeout(timer);
			timer = setTimeout(() => {
				handled = true;
				pressOrigin = null;
				options.onLongPress();
			}, options.longPressMs);
		},

		move(point) {
			if (swipeOrigin) {
				const dx = point.x - swipeOrigin.x;
				const dy = point.y - swipeOrigin.y;
				if (dy < -options.swipeUpPx && Math.abs(dy) > Math.abs(dx)) {
					swipeOrigin = null;
					handled = true;
					stopPress();
					options.onSwipeUp();
					return;
				}
			}

			if (!pressOrigin) return;
			const dx = Math.abs(point.x - pressOrigin.x);
			const dy = Math.abs(point.y - pressOrigin.y);
			if (dx > options.moveTolerancePx || dy > options.moveTolerancePx) {
				handled = true;
				stopPress();
			}
		},

		end() {
			stopPress();
			swipeOrigin = null;
		},

		consumeHandled() {
			stopPress();
			const was = handled;
			handled = false;
			return was;
		},

		cancel() {
			stopPress();
			swipeOrigin = null;
			handled = false;
		}
	};
}
