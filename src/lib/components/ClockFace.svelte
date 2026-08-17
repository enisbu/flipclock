<script lang="ts">
	import FlipCard from '$lib/components/FlipCard.svelte';
	import { spokenTime, type ClockTime } from '$lib/clock';
	import { settings } from '$lib/settings.svelte';

	let { time }: { time: ClockTime } = $props();

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
</script>

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

<p class="sr-only" aria-live="polite">
	{spokenTime(time, settings.showSeconds)}{settings.subline === 'date' ? `, ${dateLabel}` : ''}
</p>

<style>
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

	@media (min-aspect-ratio: 10 / 16) {
		.row--seconds {
			--row-units: 2.5;
		}
	}
</style>
