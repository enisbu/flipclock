<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
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

	const IDLE_MS = 12000;

	/* Names only. The preview carries the theme's own data-theme attribute and renders
	   from the CSS variables in app.css, so the colors live in one place. */
	const THEME_LABELS: Record<Theme, string> = {
		default: 'Mono',
		warm: 'Warm',
		night: 'Night',
		slate: 'Slate'
	};

	/* Shared by the duration presets and the theme swatches: same card, same selected
	   border, same caption. */
	const CARD =
		'flex flex-1 cursor-pointer flex-col items-center rounded-xl border bg-transparent px-1 pt-2.5 pb-2 transition-colors';
	const cardBorder = (selected: boolean) => (selected ? 'border-accent' : 'border-white/10');
	const cardCaption = (selected: boolean) =>
		cn('text-xs font-medium', selected ? 'text-white/90' : 'text-white/65');

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	function resetIdle() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (open = false), IDLE_MS);
	}

	$effect(() => {
		if (open) resetIdle();
		return () => clearTimeout(idleTimer);
	});
</script>

<Drawer.Root bind:open shouldScaleBackground={false}>
	<Drawer.Content
		class="data-[vaul-drawer-direction=bottom]:rounded-t-3xl"
		onpointerdown={resetIdle}
		onpointermove={resetIdle}
		oninput={resetIdle}
	>
		<div
			class="sheet-body mx-auto w-full max-w-104 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
			data-vaul-no-drag
		>
			<Drawer.Header class="head flex-row items-center justify-between p-0 min-h-10">
				<Drawer.Title class="text-[0.9375rem] font-semibold">Settings</Drawer.Title>
				<Button
					variant="ghost"
					size="sm"
					class="-mr-2 font-semibold"
					onclick={() => (open = false)}>Done</Button
				>
			</Drawer.Header>

			{#if settings.face === 'clock'}
				<div class="group-box divide-border mt-2 divide-y rounded-2xl bg-white/4 px-4">
					<Label
						class="flex min-h-12 items-center justify-between gap-6 text-[0.9375rem] font-normal"
					>
						24-hour time
						<Switch bind:checked={settings.use24h} />
					</Label>

					<Label
						class="flex min-h-12 items-center justify-between gap-6 text-[0.9375rem] font-normal"
					>
						Seconds
						<Switch bind:checked={settings.showSeconds} />
					</Label>

					<div class="flex flex-col gap-2.5 py-3.5">
						<span id="subline-label" class="text-muted-foreground text-[0.8125rem] font-medium">
							Subline
						</span>
						<div
							class="flex rounded-lg bg-white/6 p-0.5"
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
				<div class="group-box mt-2 rounded-2xl bg-white/4 px-4">
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
									class={cn(CARD, 'gap-0.5', cardBorder(settings.focusMinutes === minutes))}
								>
									<span class="text-lg font-semibold tabular-nums" aria-hidden="true"
										>{minutes}</span
									>
									<span class={cardCaption(settings.focusMinutes === minutes)}>min</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<div class="group-box divide-border mt-3 divide-y rounded-2xl bg-white/4 px-4">
				<div class="flex flex-col gap-2.5 py-3.5">
					<span id="theme-label" class="text-muted-foreground text-[0.8125rem] font-medium"
						>Theme</span
					>
					<div class="flex gap-2" role="radiogroup" aria-labelledby="theme-label">
						{#each THEMES as theme (theme)}
							<button
								type="button"
								role="radio"
								aria-checked={settings.theme === theme}
								aria-label={THEME_LABELS[theme]}
								onclick={() => (settings.theme = theme)}
								class={cn(CARD, 'gap-1.5', cardBorder(settings.theme === theme))}
							>
								<span
									data-theme={theme}
									class="relative flex h-9 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-(--card-bg) text-lg font-semibold text-(--digit-color) tabular-nums after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:-translate-y-1/2 after:bg-black/70"
									aria-hidden="true">8</span
								>
								<span class={cardCaption(settings.theme === theme)} aria-hidden="true"
									>{THEME_LABELS[theme]}</span
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
	</Drawer.Content>
</Drawer.Root>

<style>
	@media (max-height: 30rem) {
		.sheet-body {
			display: grid;
			grid-template-columns: 1fr 1fr;
			column-gap: 1rem;
			align-content: start;
			max-width: 38rem;
		}

		:global(.head) {
			grid-column: 1 / -1;
		}

		.group-box + .group-box {
			margin-top: 0.5rem;
		}
	}
</style>
