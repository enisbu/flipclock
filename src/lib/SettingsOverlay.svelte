<script lang="ts">
	// The only operable surface in the app. It is summoned by a long press and
	// leaves on its own, so nothing about it is visible while the clock is at rest.
	import { settings, THEMES } from '$lib/settings.svelte';

	/** Idle time before the overlay dismisses itself. */
	const IDLE_MS = 6000;

	let { onclose }: { onclose: () => void } = $props();

	let panel: HTMLDivElement | undefined = $state();
	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	function resetIdle() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(onclose, IDLE_MS);
	}

	$effect(() => {
		// Focus moves into the panel on open so a keyboard or screen reader user
		// lands on the controls instead of somewhere behind the overlay.
		const previouslyFocused = document.activeElement as HTMLElement | null;
		panel?.querySelector<HTMLElement>('input, select, button')?.focus();
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
		const focusable = [...panel.querySelectorAll<HTMLElement>('input, select, button')];
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
	onpointerdown={(event) => {
		if (event.target === event.currentTarget) onclose();
	}}
>
	<div
		class="panel"
		bind:this={panel}
		role="dialog"
		aria-modal="true"
		aria-label="Clock settings"
		tabindex="-1"
		onpointerdown={resetIdle}
		onpointermove={resetIdle}
		oninput={resetIdle}
	>
		<label class="row">
			<span>24 hour time</span>
			<input type="checkbox" bind:checked={settings.use24h} />
		</label>

		<label class="row">
			<span>Show seconds</span>
			<input type="checkbox" bind:checked={settings.showSeconds} />
		</label>

		<label class="row">
			<span>Show date</span>
			<input type="checkbox" bind:checked={settings.showDate} />
		</label>

		<label class="row">
			<span>Theme</span>
			<select bind:value={settings.theme}>
				{#each THEMES as theme (theme)}
					<option value={theme}>{theme}</option>
				{/each}
			</select>
		</label>

		<label class="row">
			<span>Brightness</span>
			<input
				type="range"
				min="0.2"
				max="1"
				step="0.05"
				bind:value={settings.brightness}
				aria-valuetext="{Math.round(settings.brightness * 100)} percent"
			/>
		</label>

		<button class="done" type="button" onclick={onclose}>Done</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.72);
		animation: fade-in 160ms ease-out;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: min(20rem, 82vw);
		max-height: 86dvh;
		overflow-y: auto;
		padding: 1.25rem;
		border-radius: 1rem;
		background: #151515;
		color: #f2f2f2;
		font-size: 1rem;
		font-weight: 500;
		box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.6);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		/* Comfortable touch target on a phone that is normally never touched. */
		min-height: 2.75rem;
		cursor: pointer;
	}

	select,
	input[type='range'] {
		min-width: 9rem;
		accent-color: var(--accent, #539bf5);
	}

	select {
		padding: 0.35rem 0.5rem;
		border: 1px solid #333;
		border-radius: 0.5rem;
		background: #0d0d0d;
		color: inherit;
		font: inherit;
	}

	input[type='checkbox'] {
		width: 1.4rem;
		height: 1.4rem;
		accent-color: var(--accent, #539bf5);
	}

	.done {
		margin-top: 0.25rem;
		padding: 0.6rem;
		border: 1px solid #333;
		border-radius: 0.5rem;
		background: #0d0d0d;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	:global(:focus-visible) {
		outline: 2px solid var(--accent, #539bf5);
		outline-offset: 2px;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.backdrop {
			animation: none;
		}
	}
</style>
