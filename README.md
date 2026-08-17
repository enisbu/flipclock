# Flipclock

A flip clock webapp for a phone that sits in a holder on your desk: something you glance at, never operate.

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00)
![SvelteKit 2](https://img.shields.io/badge/SvelteKit-2-ff3e00)
![License: MIT](https://img.shields.io/badge/License-MIT-blue)

Live at [flip.enisdev.com](https://flip.enisdev.com).

```sh
npm install     # Node 22 LTS
npm run dev     # dev server
npm run build   # production build into build/
npm run check   # svelte-check, must report 0 errors and 0 warnings
npm test        # vitest, pure logic only
```

## Features

At rest the screen shows the clock on black and nothing else. There is no gear, no toolbar, no panel. A tap toggles fullscreen, a long press of about 600 ms opens a settings overlay that dismisses itself after a few seconds of no interaction.

- Works offline forever. A service worker caches the shell and every build asset on first load, so the app runs in airplane mode indefinitely. No backend, no API, no tracking, no CDN font.
- Zero runtime dependencies. A handful of source files, no framework beyond SvelteKit, no CSS framework, no animation library.
- Drift free tick. Every tick recomputes the time from `Date` and arms a fresh `setTimeout` for the exact distance to the next boundary, so the clock does not slide under load or fire a salvo after waking up.
- Screen wake lock that re acquires after every visibility change, because Android drops the lock whenever the page goes hidden.
- Pixel shift against OLED burn in: the clock moves by up to two pixels every three minutes, slowly enough that nobody sees it.
- The time is real text in the DOM in an `aria-live` region, not just a stack of styled boxes.
- `prefers-reduced-motion` is honored down to the pixel shift.
- Portrait and landscape both get their own layout: the cards stack vertically in portrait and sit side by side in landscape.

Five settings, stored in `localStorage` under `flip-clock-settings` and versioned with a migration chain so a rename cannot wipe your config: 24 hour time, seconds on/off, date on/off, theme preset, brightness. That is the complete list. Timers, alarms, weather, calendar, music control, accounts, sync and color pickers are deliberately out of scope.

Honest limitation: true kiosk fullscreen, hiding the Android status and navigation bars, is not reachable through any web API and would need an MDM. A tap toggles the browser fullscreen mode, and that is the ceiling.

## Setup on Android

1. Open the site in Chrome and choose "Add to home screen". The manifest only takes effect once it runs as an installed app, and a second tab can no longer steal the wake lock.
2. Keep the phone on the charger. Set the screen timeout to its longest value, turn adaptive brightness off and fix the brightness low. A low brightness reads better in a dark room and is the best protection against burn in.
3. Optional, and more reliable than the Wake Lock API: enable "Stay awake while charging" in the Android developer options. It only works on the charger.

Use an old phone you no longer carry, and take the case off. Charging and running the display at the same time produces heat, and sustained heat above 45 degrees Celsius damages the battery.

## Architecture

Design decisions and the reasoning behind them: [docs/architecture.md](docs/architecture.md).

Note on the build: the adapter is `@sveltejs/adapter-node`, not `adapter-static`, and that is deliberate. With `prerender = true` and `ssr = false` the Node process only ever hands out a static prerendered shell, so there is no runtime SSR. The reason for the Node adapter is the deploy target, and it is explained in the architecture doc.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the scope section: this app refuses features on purpose.

## License

MIT, see [LICENSE](LICENSE).
