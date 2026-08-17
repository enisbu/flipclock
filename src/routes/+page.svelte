<script lang="ts">
	import { untrack } from 'svelte';
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

	/** How long the one time gesture hint stays on screen before it fades out. */
	const HINT_MS = 4000;
	/** Length of the fade, kept in sync with the CSS transition below. */
	const HINT_FADE_MS = 900;

	let time = $state(readTime(settings.use24h));
	let shiftX = $state(0);
	let shiftY = $state(0);
	let showSettings = $state(false);
	// The one time hint. Mounted only on a first run and removed for good after it
	// fades, so at rest the screen is the clock on black and nothing else.
	let hintVisible = $state(false);
	let hintMounted = $state(false);

	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let pressOrigin: { x: number; y: number } | null = null;
	// Set once the long press fires, so the following click does not also toggle fullscreen.
	let longPressFired = false;

	settings.persist();

	const dateFormat = new Intl.DateTimeFormat('en', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});

	// Reading time.hours subscribes this derived to the tick, so the label is
	// recomputed at every hour boundary and rolls over at midnight. Without that read
	// it would be evaluated once and keep showing the previous day until a reload.
	// The value itself is unused: the date comes from Date, like the tick does.
	const dateLabel = $derived.by(() => {
		void time.hours;
		return dateFormat.format(new Date());
	});

	$effect(() => {
		requestPersistentStorage();
	});

	// First run only: show the gesture once, then write the flag so it never returns.
	// Everything about the app hides behind a long press and nothing on the naked
	// surface hints at it, which is why a first time viewer sees only a clock and
	// concludes there is nothing else there.
	//
	// The flag is read untracked on purpose. Reading it reactively would make this
	// effect depend on the very value it writes below, so the write would tear the
	// effect down and clear its own timers before the hint ever faded in.
	$effect(() => {
		if (untrack(() => settings.hintSeen)) return;

		hintMounted = true;
		// A frame later, so the element mounts at opacity 0 and the fade in runs.
		const show = requestAnimationFrame(() => (hintVisible = true));
		const hide = setTimeout(() => (hintVisible = false), HINT_MS);
		// Unmount only after the fade has finished, leaving an empty surface behind.
		const drop = setTimeout(() => (hintMounted = false), HINT_MS + HINT_FADE_MS);

		// Written immediately rather than after the timers: a viewer who closes the
		// tab during those few seconds has still been shown the hint.
		settings.hintSeen = true;

		return () => {
			cancelAnimationFrame(show);
			clearTimeout(hide);
			clearTimeout(drop);
		};
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
		<!-- The row tells the size tokens how many plate widths it has to carry, so the
		     landscape branch in app.css can divide the viewport instead of assuming two
		     plates. The seconds plate is half size, hence 2.5 rather than 3. -->
		<div class="row" class:row--seconds={settings.showSeconds}>
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

	{#if hintMounted}
		<!-- First run only, then gone for good. Not a control and not focusable: it is
		     a line of text that fades out on its own and leaves the surface empty. -->
		<p class="hint" class:hint--on={hintVisible} aria-hidden="true">hold for settings</p>
	{/if}
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
		/* Clearly subordinate, half the plate size. All three tokens are scaled by the
		   same factor, so the plate keeps the face aspect and the digits keep the same
		   fill ratio inside it: a half width plate needs a half size digit or the pair
		   runs over the edge. */
		--card-w: calc(var(--card-w-base) / 2);
		--card-h: calc(var(--card-h-base) / 2);
		--digit-size: calc(var(--digit-size-base) / 2);
		/* Subordinate through size, not through a washed out numeral. opacity on the
		   wrapper blended the white digits into the plate behind them and turned them
		   grey, which read as a rendering fault rather than as a hierarchy. The plate
		   now keeps full contrast and only the digit is toned down, via a second token
		   so the declaration does not reference the property it is setting. */
		--seconds-digit: color-mix(in srgb, var(--digit-color) 88%, var(--card-bg));
	}

	.seconds :global(.digits) {
		color: var(--seconds-digit);
	}

	.date {
		/* On top of the flex gap, so the line sits clearly apart from the plates and
		   reads as a caption, not as a third row of the clock. */
		margin: var(--card-gap) 0 0;
		color: var(--digit-color);
		font-size: clamp(0.8rem, 3.2vmin, 1.25rem);
		font-weight: 500;
		letter-spacing: 0.22em;
		opacity: 0.6;
		text-transform: uppercase;
	}

	/* The one time gesture hint. Deliberately quiet: small, letterspaced, parked
	   near the bottom edge and well clear of the plates, but still above the 4.5:1
	   contrast floor, because it is the one text a first time viewer must read. It
	   fades in, holds, fades out and unmounts, so it cannot become permanent. */
	.hint {
		position: absolute;
		bottom: max(env(safe-area-inset-bottom), 6%);
		left: 50%;
		z-index: 3;
		margin: 0;
		color: var(--digit-color);
		font-size: clamp(0.75rem, 2.6vmin, 1rem);
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transform: translateX(-50%);
		transition: opacity 900ms ease;
	}

	.hint--on {
		opacity: 0.6;
	}

	/* Anything not clearly taller than it is wide reads left to right. Matched to
	   the same aspect-ratio breakpoint that picks the plate size in app.css, so a
	   near square viewport cannot end up with a stack taller than the screen. */
	@media (min-aspect-ratio: 10 / 16) {
		.row {
			flex-direction: row;
			align-items: center;
		}

		/* Hours and minutes are one plate width each, the half size seconds plate adds
		   another half. */
		.row--seconds {
			--row-units: 2.5;
		}

		/* Resolve the size tokens HERE rather than at :root, because only here is
		   --row-units final. app.css supplies the inputs, the row does the division. */
		.row {
			/* One gap between neighbours, so one less than the number of plates: 2 without
			   seconds, 3 with them. Declared here and not at :root for the same reason as
			   the size tokens: at :root it would resolve against the default --row-units
			   and never see the override above. */
			--row-gaps: calc(round(up, var(--row-units), 1) - 1);
			--card-w-base: min(
				calc((var(--row-width) - var(--row-gaps) * var(--card-gap)) / var(--row-units)),
				var(--row-cap)
			);
			--card-h-base: calc(var(--card-w-base) * var(--plate-aspect));
			--digit-size-base: calc(var(--card-w-base) * var(--digit-of-card));

			--card-w: var(--card-w-base);
			--card-h: var(--card-h-base);
			--digit-size: var(--digit-size-base);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clock {
			transition: none;
		}
	}
</style>
