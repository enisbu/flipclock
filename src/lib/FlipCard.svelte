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
			<div class="shade shade--bottom"></div>
		</div>
	{/if}
</div>

<style>
	.card {
		position: relative;
		width: var(--card-w);
		height: var(--card-h);
		/* The bundled plate face. Its digits all carry the same advance and their ink is
		   centred inside that advance, which is what CSS tabular-nums cannot do. Its
		   vertical metrics are flattened onto the digit ink, so line-height 1 centres
		   the ink in the line box by construction instead of by a nudge.

		   The second entry is the metric matched fallback declared in app.css, not the
		   raw monospace stack: it carries the same advance and line box, so the plate
		   geometry survives the file failing to load. */
		font-family: 'Split Flap', 'Split Flap Fallback', ui-monospace, monospace;
		font-size: var(--digit-size);
		font-weight: 400;
		line-height: 1;
		/* No negative tracking. CSS applies letter-spacing after the final glyph too,
		   so any non zero value drags a centred pair off centre by half of it. */
		letter-spacing: 0;
		/* Holds the fallback stack in line if the bundled face ever fails to load. */
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

	/* The plate faces. A shallow gradient reads as a lit plate rather than a flat
	   rectangle, and the inset shadow under the seam is what the upper plate casts
	   onto the lower one. That is where the sense of depth comes from. The tints are
	   mixed out of --card-bg rather than hard coded, so the theme presets keep
	   working: a warm plate stays warm, it does not turn grey. */
	.half--top,
	.flap--top {
		top: 0;
		border-radius: var(--card-radius) var(--card-radius) 0 0;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--card-bg) 88%, #fff) 0%,
			var(--card-bg) 58%,
			color-mix(in srgb, var(--card-bg) 72%, #000) 100%
		);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
	}

	.half--bottom,
	.flap--bottom {
		bottom: 0;
		border-radius: 0 0 var(--card-radius) var(--card-radius);
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--card-bg) 78%, #000) 0%,
			var(--card-bg) 42%,
			color-mix(in srgb, var(--card-bg) 92%, #fff) 100%
		);
		/* The cast shadow the upper plate throws onto the lower one. */
		box-shadow:
			inset 0 4px 9px rgb(0 0 0 / 0.85),
			inset 0 -1px 0 rgb(255 255 255 / 0.05);
	}

	/* The axis slot: the black channel the plates hang in. */
	.gap {
		position: absolute;
		top: calc(50% - (var(--gap) / 2));
		left: 0;
		width: 100%;
		height: var(--gap);
		background: #000;
		z-index: 3;
	}

	/* The two pins the plates turn on, one at each end of the axis. They ride in the
	   slot itself, which is what makes the plate read as a mechanism rather than as
	   two rectangles that happen to touch. */
	.gap::before,
	.gap::after {
		content: '';
		position: absolute;
		top: 50%;
		width: calc(var(--gap) * 1.7);
		height: calc(var(--gap) * 1.7);
		border-radius: 50%;
		background: color-mix(in srgb, var(--card-bg) 55%, #fff);
		transform: translateY(-50%);
	}

	.gap::before {
		left: calc(var(--gap) * -0.85);
	}

	.gap::after {
		right: calc(var(--gap) * -0.85);
	}

	/* Double height inside the clipped container: the digit is centered in the full
	   card space, only the respective half stays visible. The box is 200% of the half
	   plus the slot, which is the full card height, so the axis slot does not push the
	   glyph off the card centre by half its own width. */
	.digits {
		position: absolute;
		left: 0;
		width: 100%;
		height: calc(200% + var(--gap));
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

	/* Darkens the flap that rotates away, which creates the sense of depth.

	   The static faces carry a gradient now, so a flat black wash no longer matches
	   them: the falling half went uniformly dark while the plate it left behind was
	   still lit from the top, and the two read as different materials. The shade is
	   therefore a gradient of the same shape as the face under it, strongest at the
	   hinge where the plate turns away from the light and weakest at the free edge. */
	.shade {
		position: absolute;
		inset: 0;
		z-index: 3;
		background: linear-gradient(to bottom, rgb(0 0 0 / 0.35) 0%, rgb(0 0 0 / 1) 100%);
		pointer-events: none;
		animation: shade-top var(--flip-ms) linear forwards;
	}

	/* The incoming half arrives out of the dark and lights up as it reaches the
	   viewing plane, which is the same movement in reverse. Without it the bottom
	   flap appears at full brightness the instant it becomes visible and the flip
	   loses its second half. */
	.shade--bottom {
		background: linear-gradient(to bottom, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 0.35) 100%);
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

	/* Both halves are only ever visible for half of their arc, so the shading runs
	   over that half and holds. The top flap darkens from lit to fully turned away,
	   the bottom flap does the reverse as it swings into the plane. */
	@keyframes shade-top {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0.55;
		}
		100% {
			opacity: 0.72;
		}
	}

	@keyframes shade-bottom {
		0% {
			opacity: 0.72;
		}
		50% {
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
