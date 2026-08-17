<script lang="ts">
	// The only operable surface in the app. It is summoned by a long press and
	// leaves on its own, so nothing about it is visible while the clock is at rest.
	// On a phone it rises as a bottom sheet, on a wide screen it becomes a small
	// centered panel. Controls are shadcn-svelte, the container stays bespoke: it
	// carries the idle self-dismiss and the sheet/panel/grid responsive shape.
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { cn } from '$lib/utils';
	import {
		settings,
		FOCUS_PRESETS,
		SUBLINES,
		THEMES,
		type Theme
	} from '$lib/settings.svelte';

	/** Idle time before the overlay dismisses itself. Long enough to look at all
	 * four theme tiles without the sheet vanishing under the glance. */
	const IDLE_MS = 12000;

	// The enter and exit movement, both directions: the sheet slides, the centered
	// panel settles. Svelte transitions run the same path out as in, which is what
	// plain CSS keyframes could not do: an {#if} removes the node before a plain
	// animation gets a chance to play.
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

	function resetIdle() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(onclose, IDLE_MS);
	}

	$effect(() => {
		// Focus moves onto the panel itself on open, so a keyboard or screen reader
		// user is inside the dialog without a visible ring landing on Done.
		const previouslyFocused = document.activeElement as HTMLElement | null;
		panel?.focus();
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
		const focusable = [
			...panel.querySelectorAll<HTMLElement>('input, button, [role="switch"], [role="slider"]')
		];
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
	class="backdrop fixed inset-0 z-10 flex items-end justify-center bg-black/70 sm:items-center"
	role="presentation"
	transition:fade={backdropFade}
	onpointerdown={(event) => {
		if (event.target === event.currentTarget) onclose();
	}}
>
	<div
		bind:this={panel}
		in:fly={panelIn}
		out:fly={panelOut}
		role="dialog"
		aria-modal="true"
		aria-label="Clock settings"
		tabindex="-1"
		onpointerdown={resetIdle}
		onpointermove={resetIdle}
		oninput={resetIdle}
		class="panel bg-popover text-popover-foreground font-sans flex max-h-[86dvh] w-[min(26rem,100%)] flex-col overflow-y-auto rounded-t-3xl px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[0.9375rem] shadow-[0_-1rem_3rem_rgba(0,0,0,0.6)] outline-none sm:w-88 sm:rounded-3xl sm:pt-3 sm:pb-5"
	>
		<div class="grabber mx-auto mt-1 mb-2 h-1 w-9 shrink-0 rounded-full bg-white/20 sm:hidden" aria-hidden="true"></div>

		<header class="head flex min-h-10 items-center justify-between">
			<h2 class="text-[0.9375rem] font-semibold">Settings</h2>
			<Button variant="ghost" size="sm" class="-mr-2 font-semibold" onclick={onclose}>Done</Button>
		</header>

		{#if settings.face === 'clock'}
			<div class="group-box divide-border mt-2 divide-y rounded-2xl bg-white/[0.04] px-4">
				<Label class="flex min-h-12 items-center justify-between gap-6 text-[0.9375rem] font-normal">
					24-hour time
					<Switch bind:checked={settings.use24h} />
				</Label>

				<Label class="flex min-h-12 items-center justify-between gap-6 text-[0.9375rem] font-normal">
					Seconds
					<Switch bind:checked={settings.showSeconds} />
				</Label>

				<div class="flex flex-col gap-2.5 py-3.5">
					<span id="subline-label" class="text-muted-foreground text-[0.8125rem] font-medium">
						Subline
					</span>
					<div
						class="flex rounded-lg bg-white/[0.06] p-0.5"
						role="radiogroup"
						aria-labelledby="subline-label"
					>
						{#each SUBLINES as choice (choice)}
							<button
								type="button"
								role="radio"
								aria-checked={settings.subline === choice}
								onclick={() => (settings.subline = choice)}
								class={cn(
									'flex-1 cursor-pointer rounded-md py-1.5 text-[0.8125rem] font-medium capitalize transition-colors',
									settings.subline === choice ? 'bg-white/10 text-white' : 'text-white/60'
								)}
							>
								{choice}
							</button>
						{/each}
					</div>
					{#if settings.subline === 'text'}
						<Input
							type="text"
							maxlength={60}
							placeholder="Your line"
							bind:value={settings.sublineText}
							aria-label="Subline text"
						/>
					{/if}
				</div>
			</div>
		{:else}
			<div class="group-box mt-2 rounded-2xl bg-white/[0.04] px-4">
				<div class="flex flex-col gap-2.5 py-3.5">
					<span id="duration-label" class="text-muted-foreground text-[0.8125rem] font-medium">
						Duration
					</span>
					<div class="flex gap-2" role="radiogroup" aria-labelledby="duration-label">
						{#each FOCUS_PRESETS as minutes (minutes)}
							<button
								type="button"
								role="radio"
								aria-checked={settings.focusMinutes === minutes}
								onclick={() => (settings.focusMinutes = minutes)}
								class={cn(
									'flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-xl border bg-transparent px-1 pt-2.5 pb-2 transition-colors',
									settings.focusMinutes === minutes ? 'border-(--accent)' : 'border-white/10'
								)}
							>
								<span class="text-lg font-semibold tabular-nums" aria-hidden="true">{minutes}</span>
								<span
									class={cn(
										'text-xs font-medium',
										settings.focusMinutes === minutes ? 'text-white/90' : 'text-white/65'
									)}>min</span
								>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<div class="group-box divide-border mt-3 divide-y rounded-2xl bg-white/[0.04] px-4">
			<div class="flex flex-col gap-2.5 py-3.5">
				<span id="theme-label" class="text-muted-foreground text-[0.8125rem] font-medium">Theme</span>
				<div class="flex gap-2" role="radiogroup" aria-labelledby="theme-label">
					{#each THEMES as theme (theme)}
						<button
							type="button"
							role="radio"
							aria-checked={settings.theme === theme}
							aria-label={SWATCHES[theme].label}
							style="--plate: {SWATCHES[theme].plate}; --digit: {SWATCHES[theme].digit}"
							onclick={() => (settings.theme = theme)}
							class={cn(
								'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-transparent px-1 pt-2.5 pb-2 transition-colors',
								settings.theme === theme ? 'border-(--accent)' : 'border-white/10'
							)}
						>
							<!-- A miniature plate: the theme shown as the thing it themes, with the
							     seam drawn across the middle. -->
							<span
								class="relative flex h-9 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-(--plate) text-lg font-semibold text-(--digit) tabular-nums after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:-translate-y-1/2 after:bg-black/70"
								aria-hidden="true">8</span
							>
							<span
								class={cn(
									'text-xs font-medium',
									settings.theme === theme ? 'text-white/90' : 'text-white/65'
								)}
								aria-hidden="true">{SWATCHES[theme].label}</span
							>
						</button>
					{/each}
				</div>
			</div>

			<Label class="flex flex-col items-stretch gap-2.5 py-3.5 font-normal">
				<span class="text-muted-foreground text-[0.8125rem] font-medium">Brightness</span>
				<Slider
					type="single"
					min={0.2}
					max={1}
					step={0.05}
					bind:value={settings.brightness}
					aria-label="Brightness"
				/>
			</Label>
		</div>
	</div>
</div>

<style>
	/* The panel takes programmatic focus on open; the global focus ring is for
	   controls, not for the dialog container, and the Tailwind utility loses to
	   the unlayered global rule, hence this override. */
	.panel:focus-visible {
		outline: none;
	}

	/* Short viewports, which is a phone in landscape: a single column would run
	   against the height cap and bury the slider behind a scrollbar. The two groups
	   sit side by side instead, so everything stays on screen at once. This shape
	   needs a height media query, which Tailwind has no idiom for. */
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
			border-radius: 1.5rem;
		}

		.grabber {
			display: none;
		}

		.head {
			grid-column: 1 / -1;
		}

		.group-box + .group-box {
			margin-top: 0.5rem;
		}
	}
</style>
