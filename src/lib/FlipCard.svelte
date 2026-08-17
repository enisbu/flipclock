<script lang="ts">
	// A flip card shows two digits (hours or minutes).
	// Built like the mechanical original: a static top and bottom half, plus two
	// animated flaps that only exist while the value changes.
	// The centering trick: the content div is twice as tall as the half and gets
	// clipped by overflow:hidden, which puts the digit exactly on the edge.

	/** Duration of the flap movement, identical to the reference. */
	const FLIP_MS = 700;

	let { value }: { value: string } = $props();

	let previous = $state('');
	let flipping = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Last value shown, deliberately non reactive: it only drives the comparison.
	let seen: string | undefined;

	$effect(() => {
		const next = value;
		// First run: just remember it, there is nothing to flip.
		if (seen === undefined) {
			seen = next;
			previous = next;
			return;
		}
		if (next === seen) return;
		previous = seen;
		seen = next;

		// With prefers-reduced-motion the number jumps instead of flipping.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

<div class="card" aria-hidden="true">
	<div class="half half--top">
		<span class="digits">{value}</span>
	</div>
	<div class="gap"></div>
	<div class="half half--bottom">
		<span class="digits">{flipping ? previous : value}</span>
	</div>

	{#if flipping}
		<!-- The top flap carries the old number and rotates away around its bottom edge. -->
		<div class="flap flap--top">
			<span class="digits">{previous}</span>
			<div class="shade"></div>
		</div>
		<!-- The bottom flap carries the new number and rotates into the viewing plane. -->
		<div class="flap flap--bottom">
			<span class="digits">{value}</span>
		</div>
	{/if}
</div>

<style>
	.card {
		position: relative;
		width: var(--card-w);
		height: var(--card-h);
		font-size: var(--digit-size);
		line-height: 1;
		letter-spacing: -0.025em;
		/* Fixed digit width, otherwise the layout jumps on every change. */
		font-variant-numeric: tabular-nums;
		perspective: 1000px;
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

	/* Double height inside the clipped container: the digit is centered in the full
	   card space, only the respective half stays visible. */
	.digits {
		position: absolute;
		left: 0;
		width: 100%;
		height: 200%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--digit-color);
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

	/* Darkens the flap that rotates away, which creates the sense of depth. */
	.shade {
		position: absolute;
		inset: 0;
		z-index: 3;
		background: #000;
		pointer-events: none;
		animation: shade-top var(--flip-ms) linear forwards;
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
			opacity: 0.6;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flap {
			display: none;
		}
	}
</style>
