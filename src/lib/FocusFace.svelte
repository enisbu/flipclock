<script lang="ts">
	import { onDestroy } from 'svelte';
	import { IsDocumentVisible, watch } from 'runed';
	import FlipCard from '$lib/FlipCard.svelte';
	import { countdownParts } from '$lib/clock';
	import { settings } from '$lib/settings.svelte';

	type Phase = 'idle' | 'running' | 'paused' | 'done';

	let phase = $state<Phase>('idle');
	let remainingMs = $state(settings.focusMinutes * 60_000);
	let endAt = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const visible = new IsDocumentVisible();

	const parts = $derived(countdownParts(remainingMs));
	const totalMs = $derived(settings.focusMinutes * 60_000);

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

	watch(
		() => visible.current,
		(isVisible) => {
			if (isVisible && phase === 'running') {
				clearTimeout(timer);
				tick();
			}
		}
	);

	onDestroy(() => clearTimeout(timer));
</script>

<div class="focus plate-row" class:focus--done={phase === 'done'}>
	<div class="row">
		<FlipCard value={parts.minutes} />
		<FlipCard value={parts.seconds} />
	</div>
	<div class="track" aria-hidden="true">
		<div class="progress" style="--fill: {remainingMs / totalMs}"></div>
	</div>
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

	.row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--card-gap);
	}

	.track {
		width: var(--card-w);
		height: 5px;
		border-radius: 999px;
		background: var(--card-bg);
		overflow: hidden;
	}

	.progress {
		height: 100%;
		border-radius: 999px;
		background: var(--digit-color);
		opacity: 0.55;
		transform-origin: left;
		transform: scaleX(var(--fill, 1));
		transition: transform 1s linear;
	}

	.focus--done .row {
		animation: pulse 600ms ease-in-out 2;
	}

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

		.track {
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
