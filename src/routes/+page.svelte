<script lang="ts">
	import FlipCard from '$lib/FlipCard.svelte';
	import { readTime, spokenTime, startTicking, SHOW_SECONDS } from '$lib/clock';
	import { keepScreenAwake } from '$lib/wakelock';

	/** OLED-Schutz: alle 3 Minuten wandert die Uhr um wenige Pixel. */
	const SHIFT_MS = 3 * 60 * 1000;
	const SHIFT_MAX = 2;

	let time = $state(readTime());
	let shiftX = $state(0);
	let shiftY = $state(0);

	$effect(() => {
		const stopTick = startTicking((next) => (time = next));
		const releaseLock = keepScreenAwake();

		// Nach Rückkehr in den Vordergrund sofort auf die echte Zeit ziehen.
		// Der Tick rechnet ohnehin aus Date, es gibt also keine Flip-Salve.
		const onVisibility = () => {
			if (document.visibilityState === 'visible') time = readTime();
		};
		document.addEventListener('visibilitychange', onVisibility);

		const shift = setInterval(() => {
			shiftX = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
			shiftY = Math.round(Math.random() * 2 * SHIFT_MAX) - SHIFT_MAX;
		}, SHIFT_MS);

		return () => {
			stopTick();
			releaseLock();
			clearInterval(shift);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	// Fullscreen braucht eine Nutzergeste, darum der Tap auf die ganze Fläche.
	// Kein sichtbarer Knopf, der den Look zerstört.
	function toggleFullscreen() {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => {});
		} else {
			void document.documentElement.requestFullscreen().catch(() => {});
		}
	}
</script>

<svelte:head>
	<title>Flipclock</title>
</svelte:head>

<button class="stage" onclick={toggleFullscreen} aria-label="Vollbild umschalten">
	<div class="clock" style="transform: translate({shiftX}px, {shiftY}px)">
		<FlipCard value={time.hours} label="Stunden" />
		<FlipCard value={time.minutes} label="Minuten" />
		{#if SHOW_SECONDS}
			<div class="seconds">
				<FlipCard value={time.seconds} label="Sekunden" />
			</div>
		{/if}
	</div>
</button>

<p class="sr-only" aria-live="polite">{spokenTime(time)}</p>

<style>
	.stage {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		padding: 0;
		background: #000;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.clock {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
		/* Der Pixel-Shift läuft so langsam, dass er nicht auffällt. */
		transition: transform 8s linear;
	}

	.seconds {
		/* Klar untergeordnet, halbe Kartengröße. */
		--card-w: calc(var(--card-w-base) / 2);
		--card-h: calc(var(--card-h-base) / 2);
		--digit-size: calc(var(--digit-size-base) / 2);
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.clock {
			transition: none;
		}
	}
</style>
