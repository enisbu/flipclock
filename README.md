<div align="center">

# Flipclock

[![Flipclock, a split flap clock for a phone that never gets touched](static/og.png)](https://flip.enisdev.com)

![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?style=flat&logo=svelte&logoColor=white)
![SvelteKit 2](https://img.shields.io/badge/SvelteKit-2-FF3E00?style=flat&logo=svelte&logoColor=white)
![MIT](https://img.shields.io/badge/License-MIT-6366F1?style=flat)

**A split flap clock for an old phone parked in a holder on your desk**, looked at and never operated.

[Live](https://flip.enisdev.com) · [Android setup](docs/android-setup.md) · [Architecture](docs/architecture.md)

</div>

At rest the screen carries the clock on black and nothing else. No gear, no toolbar, no panel. A tap toggles fullscreen, a press of about 600 ms opens the settings overlay, and the overlay leaves on its own after six seconds without input.

There are five settings and there will not be a sixth: 24 hour time, seconds, date, theme preset, brightness. They live in `localStorage` and nowhere else.

Once the page has loaded, the network is never needed again. A service worker caches the shell and every build asset, so the clock runs in airplane mode for as long as the phone stays powered. There is no backend, no API, no tracking and no runtime dependency: the only packages in `package.json` are build tooling.

The digits come from `static/split-flap.woff2`, an Archivo subset cut down to the ten digits, the colon and the space. It weighs about 1.3 KB, ships from the repo instead of a CDN and gets cached with everything else. Every digit has the same advance width, so the display never shifts sideways as the numbers change. The license sits next to it in `static/split-flap.LICENSE.txt`.

## Setting up the phone

The app keeps the screen awake as far as the browser allows, which is less than you want. An always on display is a device configuration, not a piece of code, and this is the part you have to do yourself. It takes five minutes, once.

Install it first: open the site in Chrome and choose "Add to home screen". The manifest only applies to an installed app, and an installed app cannot have its wake lock stolen by another tab.

Then, in Android settings:

- **Developer options, "Stay awake"**, sometimes called "Keep screen on while charging". This is the setting that actually holds the display open, and it beats anything the app can do from JavaScript. Unlock developer options by tapping the build number in About phone seven times. It only works on a cable, so the phone stays plugged in permanently.
- **Display, screen timeout**: the longest value the device offers, as a backstop for the moments the wake lock is not held.
- **Display, adaptive brightness off**, then set the slider manually to somewhere around 10 to 20 percent. Do both halves. Adaptive brightness dims the clock into illegibility in the dark room where you most want to read it. The low fixed setting is also the single best defense against OLED burn in, far more than the pixel shift the app already runs.
- **Auto rotate**, to taste. The layout handles both orientations, so lock it in the orientation of your holder or leave it free and let the layout reflow.

Use a phone you no longer carry and take the case off. Charging while driving a display makes heat, and sustained heat above roughly 45 degrees Celsius damages the battery for good.

The full version, including what to check when the screen still goes to sleep: [docs/android-setup.md](docs/android-setup.md).

## Two limits worth knowing

True kiosk fullscreen, with the Android status and navigation bars gone, is not reachable from a web app. No web API exposes it and getting there needs an MDM or a kiosk launcher. A tap toggles the browser fullscreen mode and installing as a PWA drops the browser chrome. That is the ceiling.

An installed PWA also keeps the manifest values it was installed with. The manifest ships `"orientation": "any"`, so if you change it, the installed app keeps the old value until you uninstall and install again.

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

Scope, conventions and what pull requests get declined: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE). The bundled font is Archivo under the SIL Open Font License, see [static/split-flap.LICENSE.txt](static/split-flap.LICENSE.txt).
