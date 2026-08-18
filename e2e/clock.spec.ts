import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'flip-clock-settings';

type Stored = {
	face: string;
	theme: string;
	brightness: number;
	showSeconds: boolean;
};

/**
 * Seeds settings before the first load only, so a reload inside a test reads what the
 * app itself wrote rather than the seed again.
 */
async function seed(page: Page, overrides: Partial<Stored> = {}) {
	const settings = {
		version: 3,
		use24h: true,
		showSeconds: false,
		subline: 'off',
		sublineText: '',
		face: 'clock',
		focusMinutes: 25,
		theme: 'default',
		brightness: 1,
		hintSeen: true,
		...overrides
	};
	await page.addInitScript(
		([key, value]) => {
			if (!localStorage.getItem(key)) localStorage.setItem(key, value);
		},
		[STORAGE_KEY, JSON.stringify(settings)] as const
	);
}

function stored(page: Page): Promise<Stored> {
	return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), STORAGE_KEY);
}

/** Waits until the app is actually running: with ssr = false, digits mean hydrated. */
async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.digits').first()).toHaveText(/^\d{2}$/);
}

async function openSettings(page: Page) {
	await longPress(page);
	await expect(page.getByRole('radiogroup', { name: 'Theme' })).toBeVisible();
}

async function longPress(page: Page) {
	const { width, height } = page.viewportSize() ?? { width: 400, height: 800 };
	await page.mouse.move(width / 2, height / 2);
	await page.mouse.down();
	await page.waitForTimeout(800);
	await page.mouse.up();
}

test('shows the time as real text', async ({ page }) => {
	await seed(page, { showSeconds: true });
	await open(page);

	const digits = page.locator('.digits').first();
	await expect(digits).toHaveText(/^\d{2}$/);
	await expect(page.locator('p.sr-only').first()).toHaveText(/^\d{2}:\d{2}:\d{2}/);
});

test('flips a plate when the value changes', async ({ page }) => {
	await seed(page, { showSeconds: true });
	await open(page);

	// The flap only exists while the animation runs, which is the observable proof
	// that a change actually animated rather than swapping in place.
	await expect(page.locator('.flap').first()).toBeAttached({ timeout: 3000 });
	await expect(page.locator('.flap').first()).toHaveCSS('animation-duration', '0.7s');
});

test('the arrow keys walk the faces and stop at both ends', async ({ page }) => {
	await seed(page);
	await open(page);

	await page.keyboard.press('ArrowLeft');
	expect((await stored(page)).face).toBe('clock');

	await page.keyboard.press('ArrowRight');
	await expect.poll(async () => (await stored(page)).face).toBe('focus');

	await page.keyboard.press('ArrowRight');
	expect((await stored(page)).face).toBe('focus');
});

test('the focus timer counts down on tap', async ({ page }) => {
	await seed(page, { face: 'focus' });
	await open(page);

	const status = page.locator('p.sr-only');
	await expect(status.filter({ hasText: 'Focus ready' })).toBeVisible();

	await page.keyboard.press('Enter');
	await expect(status.filter({ hasText: 'Focus running' })).toBeVisible();
});

test('a long press opens the settings and a theme survives a reload', async ({ page }) => {
	await seed(page);
	await open(page);

	await openSettings(page);

	await page.getByRole('radio', { name: 'Slate' }).click();
	await expect.poll(async () => (await stored(page)).theme).toBe('slate');

	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'slate');
});

test('the swatch previews carry their own theme colors', async ({ page }) => {
	await seed(page, { theme: 'warm' });
	await open(page);
	await openSettings(page);

	// The Mono swatch has to stay Mono while the app runs a different theme.
	const mono = page.getByRole('radio', { name: 'Mono' }).locator('[data-theme]');
	await expect(mono).toHaveCSS('background-color', 'rgb(18, 18, 18)');
	await expect(mono).toHaveCSS('color', 'rgb(237, 237, 237)');
});

test('works offline once the service worker has the shell', async ({ page, context }) => {
	await seed(page);
	await open(page);
	await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
		timeout: 15_000
	});

	await context.setOffline(true);
	await page.reload();
	await expect(page.locator('.digits').first()).toHaveText(/^\d{2}$/);
	await context.setOffline(false);
});
