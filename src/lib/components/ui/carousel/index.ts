// Previous/Next ship arrow buttons and an icon dependency; this surface has no
// visible controls, the swipe is the only navigation. Both are removed.
import Content from "./carousel-content.svelte";
import Item from "./carousel-item.svelte";
import Root from "./carousel.svelte";

export {
	Root,
	Content,
	Item,
	//
	Root as Carousel,
	Content as CarouselContent,
	Item as CarouselItem,
};
