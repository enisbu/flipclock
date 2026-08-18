import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/* Against the production build, never the dev server: the service worker has no real
   assets under vite dev, and the whole point of these tests is the app as it ships. */
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'landscape',
			use: { ...devices['Desktop Chrome'], viewport: { width: 844, height: 390 } }
		},
		{
			name: 'portrait',
			use: { ...devices['Pixel 7'] }
		}
	],
	webServer: {
		command: `pnpm build && PORT=${PORT} node build/index.js`,
		port: PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
