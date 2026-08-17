<script lang="ts">
	import { untrack } from 'svelte';
	import { IsDocumentVisible, useInterval, watch } from 'runed';
	import FaceCarousel from '$lib/components/FaceCarousel.svelte';
	import ClockFace from '$lib/components/ClockFace.svelte';
	import FocusFace from '$lib/components/FocusFace.svelte';
	import SettingsOverlay from '$lib/components/SettingsOverlay.svelte';
	import { readTime, startTicking } from '$lib/clock';
	import { createGestures } from '$lib/gestures';
	import { settings, FACES, requestPersistentStorage, type Face } from '$lib/settings.svelte';
	import { keepScreenAwake } from '$lib/wakelock.svelte';

	const SHIFT_MS = 3 * 60 * 1000;
	const SHIFT_MAX = 2;

	const HINT_MS = 4000;
	const HINT_FADE_MS = 900;

	let time = $state(readTime(settings.use24h));
	let shiftX = $state(0);
	let shiftY = $state(0);
	let showSettings = $state(false);
	let focusFace: FocusFace | undefined = $state();

	const visible = new IsDocumentVisible();

	let hintVisible = $state(false);
	let hintMounted = $state(false);

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => {});
		} else {
			void document.documentElement.requestFullscreen().catch(() => {});
		}
	}

	/* What a tap does, per face. Typed against Face, so a new face cannot be added
	   without saying what tapping it means. */
	const ACTIONS: Record<Face, () => void> = {
		clock: toggleFullscreen,
		focus: () => focusFace?.toggle()
	};

	function stepFace(delta: number) {
		const next = FACES[FACES.indexOf(settings.face) + delta];
		if (next) settings.face = next;
	}

	const gestures = createGestures({
		longPressMs: 600,
		moveTolerancePx: 10,
		swipeUpPx: 64,
		onLongPress: () => (showSettings = true),
		onSwipeUp: () => (showSettings = true)
	});

	$effect(() => {
		requestPersistentStorage();
	});

	keepScreenAwake();

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

	$effect(() => {
		const root = document.documentElement;
		if (settings.theme === 'default') {
			root.removeAttribute('data-theme');
		} else {
			root.setAttribute('data-theme', settings.theme);
		}
	});

	function onPointerDown(event: PointerEvent) {
		if (showSettings) return;
		gestures.down({ x: event.clientX, y: event.clientY });
	}

	function onPointerMove(event: PointerEvent) {
		if (showSettings) return;
		gestures.move({ x: event.clientX, y: event.clientY });
	}

	function onStageClick() {
		if (gestures.consumeHandled() || showSettings) return;
		ACTIONS[settings.face]();
	}

	function onStageKeydown(event: KeyboardEvent) {
		if (showSettings) return;
		if (event.key === 'ArrowRight') stepFace(1);
		if (event.key === 'ArrowLeft') stepFace(-1);
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			ACTIONS[settings.face]();
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
	onpointerup={gestures.end}
	onpointercancel={gestures.cancel}
	onclick={onStageClick}
	role="presentation"
>
	<div class="shift" style="transform: translate({shiftX}px, {shiftY}px)">
		<FaceCarousel faces={FACES} bind:current={settings.face} face={faceView} />
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

{#snippet faceView(face: Face)}
	{#if face === 'clock'}
		<ClockFace {time} />
	{:else if face === 'focus'}
		<FocusFace bind:this={focusFace} />
	{/if}
{/snippet}

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

	@media (prefers-reduced-motion: reduce) {
		.shift {
			transition: none;
		}
	}
</style>
