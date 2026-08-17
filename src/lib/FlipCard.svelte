<script lang="ts">
	import { reducedMotion } from '$lib/motion';

	/* One source for the flip duration: the timeout that swaps the plate and the
	   keyframes that move the flap both read this. */
	const FLIP_MS = 700;

	let { value }: { value: string } = $props();

	let previous = $state('');
	let flipping = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	let seen: string | undefined;

	$effect(() => {
		const next = value;
		if (seen === undefined) {
			seen = next;
			previous = next;
			return;
		}
		if (next === seen) return;
		previous = seen;
		seen = next;

		if (reducedMotion.current) {
			previous = next;
			return;
		}

		flipping = true;
		clearTimeout(timer);
		timer = setTimeout(() => {
			flipping = false;
			previous = next;
		}, FLIP_MS);

		return () => clearTimeout(timer);
	});
</script>

<div class="card" style="--flip-ms: {FLIP_MS}ms" aria-hidden="true">
	<div class="half half--top">
		<span class="digits">{value}</span>
	</div>
	<div class="gap"></div>
	<div class="half half--bottom">
		<span class="digits">{flipping ? previous : value}</span>
	</div>

	{#if flipping}
		<div class="flap flap--top">
			<span class="digits">{previous}</span>
			<div class="shade"></div>
		</div>
		<div class="flap flap--bottom">
			<span class="digits">{value}</span>
			<div class="shade shade--bottom"></div>
		</div>
	{/if}
</div>

<style>
	.card {
		position: relative;
		width: var(--card-w);
		height: var(--card-h);
		font-family: 'Clock Digits', ui-sans-serif, system-ui, sans-serif;
		font-size: var(--digit-size);
		font-weight: 600;
		line-height: 1;
		letter-spacing: 0;
		font-variant-numeric: tabular-nums;
		perspective: 90vmin;
	}

	.half,
	.flap {
		position: absolute;
		left: 0;
		width: 100%;
		height: calc(50% - (var(--gap) / 2));
		overflow: hidden;
		background: var(--card-bg);
	}

	.half--top,
	.flap--top {
		top: 0;
		border-radius: var(--card-radius) var(--card-radius) 0 0;
	}

	.half--bottom,
	.flap--bottom {
		bottom: 0;
		border-radius: 0 0 var(--card-radius) var(--card-radius);
	}

	.gap {
		position: absolute;
		top: calc(50% - (var(--gap) / 2));
		left: 0;
		width: 100%;
		height: var(--gap);
	}

	.digits {
		position: absolute;
		left: 0;
		width: 100%;
		height: calc(200% + var(--gap));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--digit-color);
		translate: 0 0.012em;
	}

	.half--top .digits,
	.flap--top .digits {
		top: 0;
	}

	.half--bottom .digits,
	.flap--bottom .digits {
		bottom: 0;
	}

	.flap {
		z-index: 2;
		backface-visibility: hidden;
		will-change: transform;
	}

	.flap--top {
		transform-origin: bottom;
		animation: flip-top var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.flap--bottom {
		transform-origin: top;
		transform: rotateX(180deg);
		animation: flip-bottom var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.shade {
		position: absolute;
		inset: 0;
		z-index: 3;
		background: #000;
		pointer-events: none;
		animation: shade-top var(--flip-ms) linear forwards;
	}

	.shade--bottom {
		animation-name: shade-bottom;
	}

	@keyframes flip-top {
		0% {
			transform: rotateX(0deg);
		}
		100% {
			transform: rotateX(-180deg);
		}
	}

	@keyframes flip-bottom {
		0% {
			transform: rotateX(180deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}

	@keyframes shade-top {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 0.55;
		}
	}

	@keyframes shade-bottom {
		0% {
			opacity: 0.55;
		}
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flap {
			display: none;
		}
	}
</style>
