import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		// Pure logic only. Behaviour in a browser lives in e2e/ and runs under
		// playwright; whether the 3D flip LOOKS right stays a manual check on a
		// real device, no headless browser can tell us that.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
