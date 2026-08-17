<script lang="ts">
	import { untrack } from 'svelte';
	import { IsDocumentVisible, useInterval, watch } from 'runed';
	import * as Carousel from '$lib/components/ui/carousel';
	import { cn } from '$lib/utils';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import FlipCard from '$lib/FlipCard.svelte';
	import FocusFace from '$lib/FocusFace.svelte';
	import SettingsOverlay from '$lib/SettingsOverlay.svelte';
	import { readTime, spokenTime, startTicking } from '$lib/clock';
	import { reducedMotion } from '$lib/motion';
	import { settings, FACES, requestPersistentStorage } from '$lib/settings.svelte';
	import { keepScreenAwake } from '$lib/wakelock';

	const SHIFT_MS = 3 * 60 * 1000;
	const SHIFT_MAX = 2;

	const LONG_PRESS_MS = 600;
	const MOVE_TOLERANCE_PX = 10;
	const SWIPE_UP_PX = 64;

	const HINT_MS = 4000;
	const HINT_FADE_MS = 900;

	let time = $state(readTime(settings.use24h));
	let shiftX = $state(0);
	let shiftY = $state(0);
	let showSettings = $state(false);
	let focusFace: FocusFace | undefined = $state();

	let api: CarouselAPI | undefined = $state();
	const faceIndex = $derived(FACES.indexOf(settings.face));
	let settled = $state(true);
	const reduced = $derived(reducedMotion.current);
	const visible = new IsDocumentVisible();

	let hintVisible = $state(false);
	let hintMounted = $state(false);

	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let pressOrigin: { x: number; y: number } | null = null;
	let gestureOrigin: { x: number; y: number } | null = null;
	/* Set by the long press and by any drag: both mean the pointer up that follows
	   is not a tap and must not reach the face. */
	let handled = false;

	const dateFormat = new Intl.DateTimeFormat('en', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});

	/* Gate on the hour, not on time itself: every tick assigns a fresh object, so a
	   derived that reads time re-formats once a second. The hour is a string and only
	   propagates when it actually changes. */
	const hour = $derived(time.hours);
	const dateLabel = $derived.by(() => {
		void hour;
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
		next?.on('scroll', () => (settled = false));
		next?.on('settle', () => (settled = true));
	}

	$effect(() => {
		const index = faceIndex;
		if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, reduced);
	});

	$effect(() => {
		requestPersistentStorage();
	});

	$effect(() => {
		if (untrack(() => settings.hintSeen)) return;

		hintMounted = true;
		const show = requestAnimationFrame(() => (hintVisible = true));
		const hide = setTimeout(() => (hintVisible = false), HINT_MS);
		const drop = setTimeout(() => (hintMounted = false), HINT_MS + HINT_FADE_MS);

		settings.hintSeen = true;

		return () => {
			cancelAnimationFrame(show);
			clearTimeout(hide);
			clearTimeout(drop);
		};
	});

	$effect(() => {
		const use24h = settings.use24h;
		const showSeconds = settings.showSeconds;

		time = readTime(use24h);
		return startTicking((next) => (time = next), { use24h, showSeconds });
	});

	watch(
		() => visible.current,
		(isVisible) => {
			if (isVisible) time = readTime(settings.use24h);
		}
	);

	useInterval(SHIFT_MS, {
		callback: () => {
			shiftX = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
			shiftY = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
		}
	});

	$effect(() => keepScreenAwake());

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
		handled = false;
		pressOrigin = { x: event.clientX, y: event.clientY };
		gestureOrigin = pressOrigin;
		clearTimeout(pressTimer);
		pressTimer = setTimeout(() => {
			handled = true;
			pressOrigin = null;
			showSettings = true;
		}, LONG_PRESS_MS);
	}

	function onPointerMove(event: PointerEvent) {
		if (gestureOrigin && !showSettings) {
			const dx = event.clientX - gestureOrigin.x;
			const dy = event.clientY - gestureOrigin.y;
			if (dy < -SWIPE_UP_PX && Math.abs(dy) > Math.abs(dx)) {
				gestureOrigin = null;
				handled = true;
				cancelPress();
				showSettings = true;
				return;
			}
		}
		if (!pressOrigin) return;
		const dx = Math.abs(event.clientX - pressOrigin.x);
		const dy = Math.abs(event.clientY - pressOrigin.y);
		if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) {
			handled = true;
			cancelPress();
		}
	}

	function onPointerEnd() {
		cancelPress();
		gestureOrigin = null;
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => {});
		} else {
			void document.documentElement.requestFullscreen().catch(() => {});
		}
	}

	function onStageClick() {
		cancelPress();
		if (handled) {
			handled = false;
			return;
		}
		if (showSettings) return;
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

<div
	class="stage"
	style="--brightness: {settings.brightness}"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerEnd}
	onpointercancel={onPointerEnd}
	onclick={onStageClick}
	role="presentation"
>
	<div class="shift" style="transform: translate({shiftX}px, {shiftY}px)">
		<Carousel.Root
			class="h-full"
			opts={{ duration: reduced ? 0 : 20, startIndex: faceIndex }}
			setApi={onApi}
		>
			<Carousel.Content class="ms-0 h-full">
				<Carousel.Item
					class={cn(
						'face h-full basis-full ps-0',
						settled && settings.face !== 'clock' && 'invisible'
					)}
					aria-hidden={settings.face !== 'clock'}
				>
					<div class="clock plate-row">
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

				<Carousel.Item
					class={cn(
						'face h-full basis-full ps-0',
						settled && settings.face !== 'focus' && 'invisible'
					)}
					aria-hidden={settings.face !== 'focus'}
				>
					<FocusFace bind:this={focusFace} />
				</Carousel.Item>
			</Carousel.Content>
		</Carousel.Root>
	</div>

	{#if hintMounted}
		<p
			class="hint"
			class:hint--on={hintVisible}
			style="transition-duration: {HINT_FADE_MS}ms"
			aria-hidden="true"
		>
			swipe up for settings · swipe for focus
		</p>
	{/if}
</div>

<p class="sr-only" aria-live="polite">
	{spokenTime(time, settings.showSeconds)}{settings.subline === 'date' ? `, ${dateLabel}` : ''}
</p>

<SettingsOverlay bind:open={showSettings} />

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--bg);
		opacity: var(--brightness, 1);
		-webkit-tap-highlight-color: transparent;
		cursor: pointer;
		touch-action: none;
	}

	.stage :global([data-slot='carousel-content']),
	.stage :global([data-embla-container]) {
		touch-action: none !important;
	}

	.shift {
		position: absolute;
		inset: 0;
		transition: transform 8s linear;
	}

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
		gap: clamp(0.6rem, 4.5vmin, 2.4rem);
	}

	.seconds {
		--card-w: calc(var(--card-w-base) / 2);
		--card-h: calc(var(--card-h-base) / 2);
		--digit-size: calc(var(--digit-size-base) / 2);
		--seconds-digit: color-mix(in srgb, var(--digit-color) 88%, var(--card-bg));
	}

	.seconds :global(.digits) {
		color: var(--seconds-digit);
	}

	.subline {
		margin: 0;
		color: var(--digit-color);
		font-size: clamp(0.8rem, calc(var(--card-w) * 0.042), 1.75rem);
		font-weight: 500;
		letter-spacing: 0.22em;
		opacity: 0.6;
		text-transform: uppercase;
		max-width: calc(0.92 * var(--usable-w, 100vw));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hint {
		position: absolute;
		bottom: max(env(safe-area-inset-bottom), 6%);
		left: 50%;
		z-index: 3;
		margin: 0;
		color: var(--digit-color);
		font-size: clamp(0.6875rem, 2.2vmin, 0.875rem);
		font-weight: 500;
		letter-spacing: 0.02em;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transform: translateX(-50%);
		transition-property: opacity;
		transition-timing-function: ease;
	}

	.hint--on {
		opacity: 0.6;
	}

	@media (min-aspect-ratio: 10 / 16) {
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
