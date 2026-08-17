<script lang="ts">
	import FlipCard from '$lib/FlipCard.svelte';
	import SettingsOverlay from '$lib/SettingsOverlay.svelte';
	import { readTime, spokenTime, startTicking } from '$lib/clock';
	import { settings, requestPersistentStorage } from '$lib/settings.svelte';
	import { keepScreenAwake } from '$lib/wakelock';

	/** OLED protection: every 3 minutes the clock moves by a few pixels. */
	const SHIFT_MS = 3 * 60 * 1000;
	const SHIFT_MAX = 2;

	/** Press duration that opens the settings overlay. */
	const LONG_PRESS_MS = 600;
	/** Pointer travel that cancels the press, so a stray drag does nothing. */
	const MOVE_TOLERANCE_PX = 10;

	let time = $state(readTime(true));
	let shiftX = $state(0);
	let shiftY = $state(0);
	let showSettings = $state(false);

	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let pressOrigin: { x: number; y: number } | null = null;
	// Set once the long press fires, so the following click does not also toggle fullscreen.
	let longPressFired = false;

	settings.persist();

	const dateLabel = $derived(
		new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(
			new Date()
		)
	);

	$effect(() => {
		requestPersistentStorage();
	});

	// Reading both settings here is deliberate: when either flips, Svelte tears this
	// effect down (clearing the old timer) and starts a fresh tick at the new step.
	$effect(() => {
		const use24h = settings.use24h;
		const showSeconds = settings.showSeconds;

		time = readTime(use24h);
		const stopTick = startTicking((next) => (time = next), { use24h, showSeconds });

		// After returning to the foreground, snap to the real time at once.
		// The tick computes from Date anyway, so there is no flip salvo.
		const onVisibility = () => {
			if (document.visibilityState === 'visible') time = readTime(use24h);
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			stopTick();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	$effect(() => {
		const releaseLock = keepScreenAwake();

		const shift = setInterval(() => {
			shiftX = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
			shiftY = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
		}, SHIFT_MS);

		return () => {
			releaseLock();
			clearInterval(shift);
		};
	});

	// The theme rides on <html> so the page background changes too, not just the cards.
	$effect(() => {
		const root = document.documentElement;
		if (settings.theme === 'default') {
			root.removeAttribute('data-theme');
		} else {
			root.setAttribute('data-theme', settings.theme);
		}
	});

	function cancelPress() {
		clearTimeout(pressTimer);
		pressOrigin = null;
	}

	function onPointerDown(event: PointerEvent) {
		if (showSettings) return;
		longPressFired = false;
		pressOrigin = { x: event.clientX, y: event.clientY };
		clearTimeout(pressTimer);
		pressTimer = setTimeout(() => {
			longPressFired = true;
			pressOrigin = null;
			showSettings = true;
		}, LONG_PRESS_MS);
	}

	function onPointerMove(event: PointerEvent) {
		if (!pressOrigin) return;
		const dx = Math.abs(event.clientX - pressOrigin.x);
		const dy = Math.abs(event.clientY - pressOrigin.y);
		if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancelPress();
	}

	// Fullscreen needs a user gesture, hence the tap on the whole surface.
	// No visible button that would ruin the look.
	function toggleFullscreen() {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => {});
		} else {
			void document.documentElement.requestFullscreen().catch(() => {});
		}
	}

	function onStageClick() {
		cancelPress();
		// The long press already opened the overlay, so swallow its trailing click.
		if (longPressFired) {
			longPressFired = false;
			return;
		}
		if (!showSettings) toggleFullscreen();
	}
</script>

<svelte:head>
	<title>Flip Clock</title>
</svelte:head>

<div class="stage" style="--brightness: {settings.brightness}">
	<!-- The full surface hit target: it carries both the tap for fullscreen and the
	     long press for the overlay, and stays a real button for keyboard users. -->
	<button
		class="hit"
		type="button"
		onclick={onStageClick}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={cancelPress}
		onpointercancel={cancelPress}
		onpointerleave={cancelPress}
		aria-label="Toggle fullscreen"
	></button>

	<div class="clock" style="transform: translate({shiftX}px, {shiftY}px)">
		<div class="row">
			<FlipCard value={time.hours} />
			<FlipCard value={time.minutes} />
			{#if settings.showSeconds}
				<div class="seconds">
					<FlipCard value={time.seconds} />
				</div>
			{/if}
		</div>
		{#if settings.showDate}
			<p class="date" aria-hidden="true">{dateLabel}</p>
		{/if}
	</div>
</div>

<p class="sr-only" aria-live="polite">
	{spokenTime(time, settings.showSeconds)}{settings.showDate ? `, ${dateLabel}` : ''}
</p>

{#if showSettings}
	<SettingsOverlay onclose={() => (showSettings = false)} />
{/if}

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		/* Brightness is a screen side dim: the web cannot touch the device backlight. */
		opacity: var(--brightness, 1);
		-webkit-tap-highlight-color: transparent;
	}

	/* The keyboard and click path for fullscreen, stretched over the whole stage.
	   It carries no visuals, so the surface stays naked. */
	.hit {
		position: absolute;
		inset: 0;
		z-index: 1;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
	}

	.clock {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
		/* The pixel shift runs slowly enough not to be noticed. */
		transition: transform 8s linear;
		pointer-events: none;
	}

	/* Portrait stacks the cards so each one gets the full viewport width. */
	.row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
	}

	.seconds {
		/* Clearly subordinate, half the card size. */
		--card-w: calc(var(--card-w-base) / 2);
		--card-h: calc(var(--card-h-base) / 2);
		--digit-size: calc(var(--digit-size-base) / 2);
		opacity: 0.5;
	}

	.date {
		margin: 0;
		color: var(--digit-color);
		font-size: clamp(0.9rem, 4vmin, 1.6rem);
		letter-spacing: 0.08em;
		opacity: 0.55;
		text-transform: uppercase;
	}

	/* Landscape uses the wide axis: HH:MM reads left to right. */
	@media (orientation: landscape) {
		.row {
			flex-direction: row;
			align-items: center;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clock {
			transition: none;
		}
	}
</style>
