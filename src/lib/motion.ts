import { MediaQuery } from 'svelte/reactivity';

/** Reactive prefers-reduced-motion, shared by every animated part. */
export const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
