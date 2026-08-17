<script lang="ts">
	// The only operable surface in the app. It is summoned by a long press and
	// leaves on its own, so nothing about it is visible while the clock is at rest.
	// On a phone it rises as a bottom sheet, on a wide screen it becomes a small
	// centered panel. The sheet chrome stays neutral in every theme, only the
	// accent and the theme swatches carry color.
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { settings, THEMES, type Theme } from '$lib/settings.svelte';

	/** Idle time before the overlay dismisses itself. Long enough to look at all
	 * four theme tiles without the sheet vanishing under the glance. */
	const IDLE_MS = 12000;

	// The enter and exit movement, both directions: the sheet slides, the centered
	// panel settles. Svelte transitions run the same path out as in, which is what
	// the CSS keyframes this replaces could not do: an {#if} removes the node
	// before a plain animation gets a chance to play.
	const wide = window.matchMedia('(min-width: 40rem)').matches;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const panelIn = { y: wide ? 16 : 320, duration: reduced ? 0 : wide ? 220 : 300, easing: cubicOut };
	const panelOut = { y: wide ? 8 : 320, duration: reduced ? 0 : 200, easing: cubicOut };
	const backdropFade = { duration: reduced ? 0 : 200 };

	/** What each theme looks like, for the swatch row. Mirrors app.css. */
	const SWATCHES: Record<Theme, { label: string; plate: string; digit: string }> = {
		default: { label: 'Mono', plate: '#121212', digit: '#ededed' },
		warm: { label: 'Warm', plate: '#17120b', digit: '#e8d5b0' },
		night: { label: 'Night', plate: '#0a0a0a', digit: '#4a4a4a' },
		slate: { label: 'Slate', plate: '#1c2128', digit: '#adbac7' }
	};

	let { onclose }: { onclose: () => void } = $props();

	let panel: HTMLDivElement | undefined = $state();
	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	/** Filled share of the brightness track, for the slider gradient. */
	const fill = $derived(Math.round(((settings.brightness - 0.2) / 0.8) * 100));

	function resetIdle() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(onclose, IDLE_MS);
	}

	$effect(() => {
		// Focus moves into the panel on open so a keyboard or screen reader user
		// lands on the controls instead of somewhere behind the overlay.
		const previouslyFocused = document.activeElement as HTMLElement | null;
		panel?.querySelector<HTMLElement>('input, button')?.focus();
		resetIdle();

		return () => {
			clearTimeout(idleTimer);
			previouslyFocused?.focus?.();
		};
	});

	function onKeydown(event: KeyboardEvent) {
		resetIdle();
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
			return;
		}
		if (event.key !== 'Tab' || !panel) return;

		// Keep Tab inside the panel, otherwise focus wanders onto the clock behind it.
		const focusable = [...panel.querySelectorAll<HTMLElement>('input, button')];
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

<!-- The backdrop closes on any tap outside the panel. -->
<div
	class="backdrop"
	role="presentation"
	transition:fade={backdropFade}
	onpointerdown={(event) => {
		if (event.target === event.currentTarget) onclose();
	}}
>
	<div
		class="panel"
		in:fly={panelIn}
		out:fly={panelOut}
		bind:this={panel}
		role="dialog"
		aria-modal="true"
		aria-label="Clock settings"
		tabindex="-1"
		onpointerdown={resetIdle}
		onpointermove={resetIdle}
		oninput={resetIdle}
	>
		<div class="grabber" aria-hidden="true"></div>

		<header class="head">
			<h2>Settings</h2>
			<button class="done" type="button" onclick={onclose}>Done</button>
		</header>

		<div class="group">
			<label class="row">
				<span>24-hour time</span>
				<input class="switch" type="checkbox" role="switch" bind:checked={settings.use24h} />
			</label>

			<label class="row">
				<span>Seconds</span>
				<input class="switch" type="checkbox" role="switch" bind:checked={settings.showSeconds} />
			</label>

			<label class="row">
				<span>Date</span>
				<input class="switch" type="checkbox" role="switch" bind:checked={settings.showDate} />
			</label>
		</div>

		<div class="group">
			<div class="row row--stack">
				<span id="theme-label">Theme</span>
				<div class="chips" role="radiogroup" aria-labelledby="theme-label">
					{#each THEMES as theme (theme)}
						<button
							class="chip"
							class:chip--active={settings.theme === theme}
							type="button"
							role="radio"
							aria-checked={settings.theme === theme}
							aria-label={SWATCHES[theme].label}
							style="--plate: {SWATCHES[theme].plate}; --digit: {SWATCHES[theme].digit}"
							onclick={() => (settings.theme = theme)}
						>
							<span class="mini" aria-hidden="true">8</span>
							<span class="chip-label" aria-hidden="true">{SWATCHES[theme].label}</span>
						</button>
					{/each}
				</div>
			</div>

			<label class="row row--stack">
				<span>Brightness</span>
				<input
					class="slider"
					type="range"
					min="0.2"
					max="1"
					step="0.05"
					bind:value={settings.brightness}
					style="--fill: {fill}%"
					aria-valuetext="{Math.round(settings.brightness * 100)} percent"
				/>
			</label>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: rgba(0, 0, 0, 0.55);
	}

	.panel {
		display: flex;
		flex-direction: column;
		width: min(26rem, 100%);
		max-height: 86dvh;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 0.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
		border-radius: 1.5rem 1.5rem 0 0;
		background: #161616;
		color: #f2f2f2;
		font-size: 0.9375rem;
		box-shadow: 0 -1rem 3rem rgba(0, 0, 0, 0.6);
	}

	.grabber {
		flex-shrink: 0;
		width: 2.25rem;
		height: 0.25rem;
		margin: 0.25rem auto 0.5rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.22);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 2.5rem;
	}

	.head h2 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.done {
		margin-right: -0.5rem;
		padding: 0.5rem;
		border: 0;
		border-radius: 0.5rem;
		background: none;
		color: var(--accent, #d4d4d4);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.group {
		margin-top: 0.5rem;
		border-radius: 0.875rem;
		background: rgba(255, 255, 255, 0.04);
		padding: 0 1rem;
	}

	.group + .group {
		margin-top: 0.75rem;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		/* Comfortable touch target on a phone that is normally never touched. */
		min-height: 3rem;
		cursor: pointer;
	}

	.row + .row {
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	.row--stack {
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		gap: 0.625rem;
		padding: 0.875rem 0;
	}

	.row--stack > span {
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
	}

	/* The switch: a plain track and knob, no native checkbox styling. */
	.switch {
		appearance: none;
		flex-shrink: 0;
		width: 2.875rem;
		height: 1.75rem;
		margin: 0;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		cursor: pointer;
		position: relative;
		transition: background 180ms ease;
	}

	.switch::after {
		content: '';
		position: absolute;
		top: 0.1875rem;
		left: 0.1875rem;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 50%;
		background: #ededed;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
		transition:
			transform 180ms cubic-bezier(0.32, 0.72, 0, 1),
			background 180ms ease;
	}

	/* The state lives in the track alone; the knob never changes color. */
	.switch:checked {
		background: var(--accent, #d4d4d4);
	}

	.switch:checked::after {
		transform: translateX(1.125rem);
	}

	.chips {
		display: flex;
		gap: 0.5rem;
	}

	.chip {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 0.25rem 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		background: none;
		cursor: pointer;
		transition: border-color 150ms ease;
	}

	.chip--active {
		border-color: var(--accent, #d4d4d4);
	}

	/* A miniature plate: the theme shown as the thing it themes. Large enough that
	   Mono and Night stay distinguishable, with a hairline edge so the near black
	   plates do not melt into the sheet. */
	.mini {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-sizing: border-box;
		background: var(--plate);
		color: var(--digit);
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		position: relative;
		overflow: hidden;
	}

	.mini::after {
		content: '';
		position: absolute;
		top: calc(50% - 0.5px);
		left: 0;
		width: 100%;
		height: 1px;
		background: rgba(0, 0, 0, 0.7);
	}

	.chip-label {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		color: rgba(255, 255, 255, 0.66);
	}

	.chip--active .chip-label {
		color: rgba(255, 255, 255, 0.92);
	}

	/* The slider: a thin track filled up to the current value, a plain knob. */
	.slider {
		appearance: none;
		width: 100%;
		height: 1.75rem;
		margin: 0;
		background: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-runnable-track {
		height: 0.25rem;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--accent, #d4d4d4) var(--fill),
			rgba(255, 255, 255, 0.16) var(--fill)
		);
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 1.125rem;
		height: 1.125rem;
		margin-top: -0.4375rem;
		border-radius: 50%;
		background: #ededed;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	.slider::-moz-range-track {
		height: 0.25rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
	}

	.slider::-moz-range-progress {
		height: 0.25rem;
		border-radius: 999px;
		background: var(--accent, #d4d4d4);
	}

	.slider::-moz-range-thumb {
		width: 1.125rem;
		height: 1.125rem;
		border: 0;
		border-radius: 50%;
		background: #ededed;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	/* Wide screens: the sheet becomes a small centered panel. */
	@media (min-width: 40rem) {
		.backdrop {
			align-items: center;
		}

		.panel {
			width: 22rem;
			padding: 0.75rem 1.25rem 1.25rem;
			border-radius: 1.25rem;
		}

		.grabber {
			display: none;
		}
	}

	/* Short viewports, which is a phone in landscape: a single column would run
	   against the height cap and bury the slider behind a scrollbar. The two groups
	   sit side by side instead, so everything stays on screen at once. */
	@media (max-height: 30rem) {
		.backdrop {
			align-items: center;
		}

		.panel {
			display: grid;
			grid-template-columns: 1fr 1fr;
			column-gap: 1rem;
			align-content: start;
			width: min(38rem, 94vw);
			max-height: 92dvh;
			padding: 0.75rem 1.25rem 1.25rem;
			border-radius: 1.25rem;
		}

		.grabber {
			display: none;
		}

		.head {
			grid-column: 1 / -1;
		}

		.group + .group {
			margin-top: 0.5rem;
		}
	}

</style>
