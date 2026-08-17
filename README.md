# Flipclock

A flip clock for an old phone parked in a holder on your desk, looked at and never operated.

[![The clock at 10:08 on black](static/og.png)](https://flip.enisdev.com)

[Live](https://flip.enisdev.com) · [Android setup](docs/android-setup.md) · [Architecture](docs/architecture.md)

At rest the screen carries the clock on black and nothing else. A tap toggles fullscreen. A press of about 600 ms opens the settings, and they leave on their own after six seconds without input.

There are five settings and there will not be a sixth: 24-hour time, seconds, date, theme preset, brightness. They live in `localStorage` and nowhere else.

Once the page has loaded, the network is never needed again. A service worker caches everything, so the clock runs in airplane mode for as long as the phone stays powered. No backend, no tracking, no runtime dependency. The digits render in the system font with tabular numerals, so nothing shifts as the numbers change.

## Setting up the phone

An always-on display is a device setting, not a piece of code. In short: install the site as a PWA, enable "Stay awake" in the developer options, turn adaptive brightness off and fix it low, keep the phone on the cable. The full walkthrough, including OLED and heat notes: [docs/android-setup.md](docs/android-setup.md).

## Development

```bash
npm install     # Node 22 LTS
npm run dev
npm run check   # svelte-check, 0 errors and 0 warnings
npm test        # vitest, pure logic only
npm run build   # into build/
npm start       # serve the build
```

The service worker has no real assets under `vite dev`, so test offline behaviour against `npm run build && npm start`.

Scope and conventions: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE).
