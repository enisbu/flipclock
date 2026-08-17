<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import { cn } from '$lib/utils';
	import { reducedMotion } from '$lib/motion';

	let {
		faces,
		current = $bindable(),
		face
	}: {
		faces: readonly T[];
		current: T;
		face: Snippet<[T]>;
	} = $props();

	let api: CarouselAPI | undefined = $state();
	let settled = $state(true);

	const reduced = $derived(reducedMotion.current);
	const index = $derived(faces.indexOf(current));

	function onApi(next: CarouselAPI | undefined) {
		api = next;
		next?.on('select', () => (current = faces[next.selectedScrollSnap()] ?? faces[0]));
		next?.on('scroll', () => (settled = false));
		next?.on('settle', () => (settled = true));
	}

	/* The carousel keeps its own scroll position, so the two have to meet: this pushes
	   an outside change in, the select handler above reports a swipe back out. The
	   guard is what stops the two from bouncing off each other. */
	$effect(() => {
		if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, reduced);
	});
</script>

<Carousel.Root
	class="h-full"
	opts={{ duration: reduced ? 0 : 20, startIndex: index }}
	setApi={onApi}
>
	<Carousel.Content class="ms-0 h-full">
		{#each faces as item (item)}
			<Carousel.Item
				class={cn('face h-full basis-full ps-0', settled && current !== item && 'invisible')}
				aria-hidden={current !== item}
			>
				{@render face(item)}
			</Carousel.Item>
		{/each}
	</Carousel.Content>
</Carousel.Root>
