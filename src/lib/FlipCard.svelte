<script lang="ts">
	// Eine Flip-Karte zeigt zwei Ziffern (Stunden oder Minuten).
	// Aufbau wie beim mechanischen Vorbild: obere und untere statische Hälfte,
	// dazu zwei animierte Klappen, die nur während des Wechsels existieren.
	// Der Zentriertrick: das Inhalts-Div ist doppelt so hoch wie die Hälfte und
	// wird von overflow:hidden beschnitten, dadurch sitzt die Ziffer exakt auf der Kante.

	/** Dauer der Klappbewegung, identisch zur Referenz. */
	const FLIP_MS = 700;

	let { value, label }: { value: string; label: string } = $props();

	let previous = $state('');
	let flipping = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Zuletzt gezeigter Wert, bewusst ohne Reaktivität: er steuert nur den Vergleich.
	let seen: string | undefined;

	$effect(() => {
		const next = value;
		// Erster Lauf: nur merken, es gibt nichts zu klappen.
		if (seen === undefined) {
			seen = next;
			previous = next;
			return;
		}
		if (next === seen) return;
		previous = seen;
		seen = next;

		// Bei prefers-reduced-motion springt die Zahl hart um.
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
		<!-- Obere Klappe trägt die alte Zahl und dreht um ihre Unterkante weg. -->
		<div class="flap flap--top">
			<span class="digits">{previous}</span>
			<div class="shade"></div>
		</div>
		<!-- Untere Klappe trägt die neue Zahl und dreht in die Sichtebene herein. -->
		<div class="flap flap--bottom">
			<span class="digits">{value}</span>
		</div>
	{/if}
</div>
<span class="sr-only">{label}: {value}</span>

<style>
	.card {
		position: relative;
		width: var(--card-w);
		height: var(--card-h);
		font-size: var(--digit-size);
		line-height: 1;
		letter-spacing: -0.025em;
		/* Feste Ziffernbreite, sonst springt das Layout beim Wechsel. */
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

	/* Doppelte Höhe im beschnittenen Container: die Ziffer ist im vollen
	   Kartenraum zentriert, sichtbar bleibt nur die jeweilige Hälfte. */
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

	/* Verdunkelt die wegdrehende Klappe, das erzeugt die Tiefe. */
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
