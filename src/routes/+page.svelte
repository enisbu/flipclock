<script lang="ts">
	import { untrack } from 'svelte';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import FlipCard from '$lib/FlipCard.svelte';
	import FocusFace from '$lib/FocusFace.svelte';
	import SettingsOverlay from '$lib/SettingsOverlay.svelte';
	import { readTime, spokenTime, startTicking } from '$lib/clock';
	import { settings, FACES, requestPersistentStorage } from '$lib/settings.svelte';
	import { keepScreenAwake } from '$lib/wakelock';

	/** OLED protection: every 3 minutes the clock moves by a few pixels. */
	const SHIFT_MS = 3 * 60 * 1000;
	const SHIFT_MAX = 2;

	/** Press duration that opens the settings overlay. */
	const LONG_PRESS_MS = 600;
	/** Pointer travel that cancels the press and swallows the trailing tap. */
	const MOVE_TOLERANCE_PX = 10;

	/** How long the one time gesture hint stays on screen before it fades out. */
	const HINT_MS = 4000;
	/** Length of the fade, kept in sync with the CSS transition below. */
	const HINT_FADE_MS = 900;

	let time = $state(readTime(settings.use24h));
	let shiftX = $state(0);
	let shiftY = $state(0);
	let showSettings = $state(false);
	let focusFace: FocusFace | undefined = $state();

	// The carousel is Embla (shadcn-svelte). It owns the drag physics; the page
	// only keeps the selected snap and the settings value in sync, both ways.
	let api: CarouselAPI | undefined = $state();
	const faceIndex = $derived(FACES.indexOf(settings.face));
	const reduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// The one time hint. Mounted only on a first run and removed for good after it
	// fades, so at rest the screen is the clock on black and nothing else.
	let hintVisible = $state(false);
	let hintMounted = $state(false);

	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let pressOrigin: { x: number; y: number } | null = null;
	// Set once the long press fires or the pointer travelled, so the trailing
	// click neither reopens fullscreen nor toggles the timer after a swipe.
	let longPressFired = false;
	let moved = false;

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

	const sublineLabel = $derived(
		settings.subline === 'date'
			? dateLabel
			: settings.subline === 'text'
				? settings.sublineText.trim()
				: ''
	);

	function onApi(next: CarouselAPI | undefined) {
		api = next;
		next?.on('select', () => {
			settings.face = FACES[next.selectedScrollSnap()] ?? 'clock';
		});
	}

	// The other direction: a keyboard arrow or a stored value moves the deck.
	$effect(() => {
		const index = faceIndex;
		if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, reduced);
	});

	$effect(() => {
		requestPersistentStorage();
	});

	// First run only: show the gestures once, then write the flag so it never
	// returns. Everything hides behind gestures and nothing on the naked surface
	// hints at them, which is why a first time viewer sees only a clock.
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
		moved = false;
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
		if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) {
			// The pointer became a swipe: Embla takes over, the press and the
			// trailing click are both off the table.
			moved = true;
			cancelPress();
		}
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
		// A finished long press or swipe already did its work; swallow the click.
		if (longPressFired || moved) {
			longPressFired = false;
			moved = false;
			return;
		}
		if (showSettings) return;
		// The tap is the face's main action: fullscreen on the clock, start and
		// pause on the focus timer.
		if (settings.face === 'focus') {
			focusFace?.toggle();
		} else {
			toggleFullscreen();
		}
	}

	function onStageKeydown(event: KeyboardEvent) {
		if (showSettings) return;
		if (event.key === 'ArrowRight') settings.face = 'focus';
		if (event.key === 'ArrowLeft') settings.face = 'clock';
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (settings.face === 'focus') focusFace?.toggle();
			else toggleFullscreen();
		}
	}
</script>

<svelte:window on:keydown={onStageKeydown} />

<svelte:head>
	<title>Flip Clock</title>
</svelte:head>

<!-- The whole stage is one gesture surface: tap for the face's main action,
     long press for settings, drag for the carousel. Keyboard runs over the
     window handler above, so no focusable control has to sit on the surface. -->
<div
	class="stage"
	style="--brightness: {settings.brightness}"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={cancelPress}
	onpointercancel={cancelPress}
	onclick={onStageClick}
	role="presentation"
>
	<!-- The pixel shift lives on its own wrapper so its slow transition never
	     fights the carousel transform below it. -->
	<div class="shift" style="transform: translate({shiftX}px, {shiftY}px)">
		<Carousel.Root
			class="h-full"
			opts={{ duration: reduced ? 0 : 20, startIndex: faceIndex }}
			setApi={onApi}
		>
			<Carousel.Content class="ms-0 h-full">
				<Carousel.Item class="face h-full basis-full ps-0">
					<div class="clock">
						<div class="row plate-row" class:row--seconds={settings.showSeconds}>
							<FlipCard value={time.hours} />
							<FlipCard value={time.minutes} />
							{#if settings.showSeconds}
								<div class="seconds">
									<FlipCard value={time.seconds} />
								</div>
							{/if}
						</div>
						{#if sublineLabel}
							<p class="subline" aria-hidden="true">{sublineLabel}</p>
						{/if}
					</div>
				</Carousel.Item>

				<Carousel.Item class="face h-full basis-full ps-0">
					<FocusFace bind:this={focusFace} />
				</Carousel.Item>
			</Carousel.Content>
		</Carousel.Root>
	</div>

	{#if hintMounted}
		<!-- First run only, then gone for good. Not a control and not focusable: it is
		     a line of text that fades out on its own and leaves the surface empty. -->
		<p class="hint" class:hint--on={hintVisible} aria-hidden="true">
			hold for settings · swipe for focus
		</p>
	{/if}
</div>

<p class="sr-only" aria-live="polite">
	{spokenTime(time, settings.showSeconds)}{settings.subline === 'date' ? `, ${dateLabel}` : ''}
</p>

{#if showSettings}
	<SettingsOverlay onclose={() => (showSettings = false)} />
{/if}

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--bg);
		/* Brightness is a screen side dim: the web cannot touch the device backlight. */
		opacity: var(--brightness, 1);
		-webkit-tap-highlight-color: transparent;
		cursor: pointer;
	}

	.shift {
		position: absolute;
		inset: 0;
		/* The pixel shift runs slowly enough not to be noticed. */
		transition: transform 8s linear;
	}

	/* The Embla viewport ships with overflow-hidden but no height of its own. */
	.stage :global([data-slot='carousel-content']) {
		height: 100%;
	}

	.stage :global(.face) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clock {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
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

	.subline {
		/* On top of the flex gap, so the line sits clearly apart from the plates and
		   reads as a caption, not as a third row of the clock. */
		margin: var(--card-gap) 0 0;
		color: var(--digit-color);
		font-size: clamp(0.8rem, 3.2vmin, 1.25rem);
		font-weight: 500;
		letter-spacing: 0.22em;
		opacity: 0.6;
		text-transform: uppercase;
		/* A 60 character line at this tracking outgrows a phone; it stays one
		   quiet line and ellipsizes instead of wrapping toward the hint zone. */
		max-width: 92vw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The one time gesture hint. Deliberately quiet: small, parked near the bottom
	   edge and well clear of the plates, but still above the 4.5:1 contrast floor,
	   because it is the one text a first time viewer must read. It fades in, holds,
	   fades out and unmounts, so it cannot become permanent. */
	.hint {
		position: absolute;
		bottom: max(env(safe-area-inset-bottom), 6%);
		left: 50%;
		z-index: 3;
		margin: 0;
		color: var(--digit-color);
		/* Distinct from the subline on purpose: lowercase, tight, smaller. An
		   instruction must not wear the clothes of a permanent caption. */
		font-size: clamp(0.6875rem, 2.2vmin, 0.875rem);
		font-weight: 500;
		letter-spacing: 0.02em;
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
	   the same aspect-ratio breakpoint that picks the plate size in app.css, where
	   the shared .plate-row rule resolves the size tokens. */
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
	}

	@media (prefers-reduced-motion: reduce) {
		.shift {
			transition: none;
		}
	}
</style>
