<script lang="ts">
	// The focus face: a countdown on the same plates as the clock. Tap starts and
	// pauses (wired by the page, which owns the tap), the duration comes from the
	// settings presets, and a hairline under the plates carries the progress.
	// Drift free like the clock: every tick recomputes the remainder from Date.
	import FlipCard from '$lib/FlipCard.svelte';
	import { countdownParts } from '$lib/clock';
	import { settings } from '$lib/settings.svelte';

	type Phase = 'idle' | 'running' | 'paused' | 'done';

	let phase = $state<Phase>('idle');
	let remainingMs = $state(settings.focusMinutes * 60_000);
	let endAt = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const parts = $derived(countdownParts(remainingMs));
	const totalMs = $derived(settings.focusMinutes * 60_000);

	// Picking a preset resets the timer; that is the reset control.
	$effect(() => {
		const ms = settings.focusMinutes * 60_000;
		clearTimeout(timer);
		phase = 'idle';
		remainingMs = ms;
	});

	function tick() {
		remainingMs = Math.max(0, endAt - Date.now());
		if (remainingMs <= 0) {
			phase = 'done';
			navigator.vibrate?.([200, 100, 200]);
			return;
		}
		timer = setTimeout(tick, remainingMs % 1000 || 1000);
	}

	/** The face's main action, called by the page on tap. */
	export function toggle() {
		if (phase === 'running') {
			clearTimeout(timer);
			remainingMs = Math.max(0, endAt - Date.now());
			phase = 'paused';
		} else if (phase === 'done') {
			phase = 'idle';
			remainingMs = totalMs;
		} else {
			endAt = Date.now() + remainingMs;
			phase = 'running';
			tick();
		}
	}

	// After the tab was hidden, the pending timeout fires late; snap to the truth.
	$effect(() => {
		const onVisibility = () => {
			if (document.visibilityState === 'visible' && phase === 'running') {
				clearTimeout(timer);
				tick();
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			clearTimeout(timer);
		};
	});
</script>

<!-- plate-row sits on the container so the resolved size tokens reach the
     progress line too, not only the plates. -->
<div class="focus plate-row" class:focus--done={phase === 'done'}>
	<div class="row">
		<FlipCard value={parts.minutes} />
		<FlipCard value={parts.seconds} />
	</div>
	<!-- The face's standing mark: the track is always there, full width at rest,
	     emptying while the countdown runs. The clock never carries a line, so a
	     glance cannot misread 23:45 remaining as a quarter to midnight.
	     Scaled, not resized: a width animation would relayout every second. -->
	<!-- The scale rides in a custom property so the done rule below can override
	     the transform in the cascade; an inline transform would always win. -->
	<div class="progress" style="--fill: {remainingMs / totalMs}" aria-hidden="true"></div>
</div>

<p class="sr-only" aria-live="polite">
	{phase === 'running'
		? `Focus running, ${parts.minutes} minutes left`
		: phase === 'paused'
			? 'Focus paused'
			: phase === 'done'
				? 'Focus done'
				: `Focus ready, ${settings.focusMinutes} minutes`}
</p>

<style>
	.focus {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
	}

	/* Same stacking rules as the clock: portrait stacks, wide sits side by side.
	   Both plates are full size; a countdown has no subordinate digits. */
	.row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
	}

	.progress {
		width: var(--card-w);
		height: 2px;
		border-radius: 1px;
		background: var(--digit-color);
		opacity: 0.6;
		transform-origin: center;
		transform: scaleX(var(--fill, 1));
		transition: transform 1s linear;
	}

	.focus--done .row {
		animation: pulse 600ms ease-in-out 2;
	}

	/* The finished state has to survive the moment of finishing: after the pulse
	   the line breathes a few times, then holds at full strength until the next
	   tap resets the face. A later glance still reads "done" instead of a clock
	   stuck at 00:00, and the surface returns to rest instead of moving forever. */
	.focus--done .progress {
		transform: none;
		opacity: 0.75;
		animation: breathe 2.4s ease-in-out 3;
	}

	@keyframes pulse {
		50% {
			transform: scale(1.015);
		}
	}

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 0.2;
		}
	}

	@media (min-aspect-ratio: 10 / 16) {
		.row {
			flex-direction: row;
		}

		/* Side by side the line spans the whole pair, matching the row width. */
		.progress {
			width: calc(var(--card-w) * 2 + var(--card-gap));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.focus--done .row,
		.focus--done .progress {
			animation: none;
		}

		.focus--done .progress {
			opacity: 0.75;
		}

		.progress {
			transition: none;
		}
	}
</style>
