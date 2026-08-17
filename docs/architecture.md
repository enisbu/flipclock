# Architecture

This is the file to read before touching `src/`. It covers the decisions that reading the code will not explain: not what the code does, but why it does it that way. Where a choice looks wrong at first glance, the reasoning is spelled out, because that is the part a reader cannot reconstruct.

The app is deliberately small: nine source files, zero runtime dependencies, one route. Every section below is a place where a plausible alternative was rejected for a concrete reason.

## The drift free tick

`src/lib/clock.ts`

A clock built on `setInterval(fn, 1000)` slips. The browser throttles timers in background tabs, a busy main thread delays them, and the error accumulates because nothing ever corrects it. After an hour of load the display can be several seconds off, and it never recovers on its own.

Instead, every tick recomputes the distance to the next boundary from `Date` and arms a fresh `setTimeout` for exactly that span. `nextDelay(step, now)` returns `step - (now % step) + 20`. Because the delay is derived from the wall clock rather than counted forward, an error in one tick does not carry into the next one. A tick that fires late simply gets a shorter wait next time.

The 20 ms is a safety margin. Timers are allowed to fire a little early, and a timer that lands a fraction before the boundary would read the old second, then schedule a delay of roughly zero and hit the same boundary twice. Twenty milliseconds past the boundary costs nothing visually and removes the double fire.

The same design solves the background problem for free. `readTime()` reads `Date` on every tick, so the digits always show the real time, never a count of how many ticks have run. When the phone comes back from sleep, the clock shows the correct time on the next tick instead of firing a salvo of single step flips to catch up. `+page.svelte` adds a `visibilitychange` listener that reads the time immediately on return, so the correction is instant rather than up to a minute late.

The step itself is either one second or one full minute, depending on whether seconds are shown. With seconds off, the app wakes up sixty times less often, which matters on a device running this for eight hours a day.

## The four layer flip card

`src/lib/FlipCard.svelte`

The card imitates a mechanical split flap, and it needs four layers to do it.

Two of them are static: a top half and a bottom half, always present. The other two are flaps that exist only while a digit changes. The top flap carries the old number and rotates away around its bottom edge, from `rotateX(0deg)` to `rotateX(-180deg)`. The bottom flap carries the new number, starts pre rotated at `rotateX(180deg)` and swings into the viewing plane. `backface-visibility: hidden` keeps each flap invisible during the half of its arc where it faces away, so the two animations read as one physical sheet falling.

The part that is genuinely non obvious is the centering. A numeral has to look like one glyph cut in half by the seam, not like two numerals stacked. The trick: the digit container is 200 percent of the height of its half and centers the glyph inside that doubled box. The half then clips it with `overflow: hidden`. The top half pins the container to `top: 0` and the bottom half to `bottom: 0`, so both show a different slice of the same centered glyph, and the numeral sits exactly on the edge. Change the height of `.digits` away from `200%` and the digits shift off the seam.

A `.shade` overlay animates from `opacity: 0` to `0.6` over the departing flap. Without it the flip looks flat, because a real flap darkens as it turns away from the light. It is the whole depth effect.

The flap only exists while `flipping` is true. A timer clears it after the animation duration, and the static bottom half shows the old value for exactly that window so nothing flickers behind the moving flap.

With `prefers-reduced-motion: reduce` the component skips the animation entirely and the number jumps. This is checked in two places on purpose: the CSS hides the flaps, and the script also skips setting up the flip state, so no timers run for an animation nobody sees.

## OLED pixel shift

`src/routes/+page.svelte`

Bright static pixels on an OLED panel age faster than dark ones, and a clock is the worst case: the same glyph edges in the same place for hours. Every three minutes the whole clock moves to a new offset of up to two pixels in each direction, over an eight second linear transition. Two pixels over eight seconds is below the threshold where a person notices movement, but it spreads the load of the bright numerals across a few more pixels.

Be honest about the ranking here. Low device brightness is the primary defence and the pixel shift is a distant second. With eight hours a day of static content, visible burn in is documented within six to twelve months, and pixels age roughly two to three times faster at full brightness than at a low setting. A two pixel shift does not save a panel that runs at maximum brightness. That is why `docs/android-setup.md` puts brightness first and why the default theme is true black: a switched off OLED pixel does not age at all.

The transition is disabled under `prefers-reduced-motion`. The shift still happens, it just jumps instead of gliding.

## Wake lock and its re acquire

`src/lib/wakelock.ts`

`navigator.wakeLock.request('screen')` asks the browser to keep the display on. Android releases that lock on every transition to hidden, and it does not come back on its own. So the module listens on `visibilitychange` and requests a new lock whenever the page becomes visible again. Without that, the screen stays awake exactly until the first notification pulls focus away, and never again.

The spec calls this a request, not a guarantee. The lock screen, an incoming call, battery saver and a missing HTTPS context all revoke or refuse it. The API is also absent in some browsers. Every one of those cases is normal operation, not an error, so the failure path does nothing at all: it catches, clears the reference and lets the clock keep running. A clock that stops because a screen setting failed would be worse than a clock on a screen that dims.

This is why the device side setup in `docs/android-setup.md` matters. The Wake Lock API is the convenient path. The Android developer option that keeps the screen on while charging is the reliable one.

## The offline model

`src/service-worker.ts`, `src/lib/settings.svelte.ts`

Offline forever is the hardest promise the app makes: after the first load it must never need the network again, and it must survive airplane mode indefinitely. Two pieces carry that.

**Assets.** A hand written service worker uses SvelteKit's `$service-worker` module, which provides the exact build output (`build`), the static files (`files`) and a `version` string at build time. No Workbox, no plugin, no generated config, because the framework already knows the asset list. On install it caches those assets plus the prerendered shell at `/`. The shell is cached explicitly because it appears in neither `build` nor `files`, and without it a cold reload with no network would find no document at all and show nothing. On activate it deletes every cache whose key is not the current version, so an old build cannot leave stale bytes behind. Requests for known assets are answered cache first, since they are content hashed and cannot go stale. Everything else goes to the network with a cache fallback, and navigations fall back to the shell.

`skipWaiting` is deliberately absent. A new worker waits until the tab is closed and reopened. On a display someone glances at, a clock that reloads itself mid glance is worse than a clock running yesterday's build.

Note that `build` and `files` are empty under `vite dev`. Offline behaviour has to be verified against a production build, never against the dev server.

**Settings.** One `localStorage` key, `flip-clock-settings`, holding one JSON object. Five settings, a few hundred bytes. IndexedDB would buy transactions and indexes for data that needs neither. Every sync engine (Automerge, Yjs, ElectricSQL) exists to merge concurrent edits across devices, and there is one device and one user, so there is nothing to merge.

The one non obvious part is the version field and the migration chain. The version lives inside the serialized object rather than in a second key, so the value and its schema version are always written and read together and cannot drift apart. `migrate()` walks the chain from the stored version up to the current one, then `coerce()` validates. Defaults are spread last so a key added in a later version arrives with its default instead of `undefined`. It costs about ten lines and it is what stops a future rename from silently wiping a real user's configuration. There is no server backup, so a bad migration is unrecoverable. That is also why the chain is unit tested.

Any failure at any point yields the defaults. A corrupt stored value must never leave someone staring at a blank screen. `loadSettings()` also guards on `typeof localStorage === 'undefined'`, which is load bearing: prerendering runs this module in Node, where the identifier does not exist and a bare `try`/`catch` around a bare reference is not enough.

`navigator.storage.persist()` is called once at startup to ask the browser not to evict the origin under storage pressure. Chrome legitimately answers false until a site has earned engagement, so the result is informational and gates nothing.

## Orientation

`src/app.css`, `src/routes/+page.svelte`

Both orientations are first class. Portrait stacks the two cards vertically so each one can claim the full width. Landscape puts them side by side so `HH:MM` reads left to right. That is one `@media (orientation: landscape)` block changing `flex-direction`, plus one on `:root` changing the size tokens.

The size tokens are the reason a plain flip is not enough. In portrait they are `vmin` based, and `vmin` follows the width, so a card at `76vmin` fills the screen nicely. In landscape `vmin` follows the height instead, so two or three cards side by side would each claim 76 percent of the height as their width and overflow the wide axis. The landscape block therefore measures width against `vw` and height against `dvh`. `dvh` rather than `vh` because it holds up in a normal browser tab where the toolbar eats into the viewport.

There is no JavaScript in this path. Container queries need a containment context, and the clock is the page and owns the whole viewport, so there is nothing to contain. An `aspect-ratio` query would be equivalent and reads worse. A JS listener would add a reactive value to reproduce what one CSS rule already does, and it would render wrong before hydration.

The manifest no longer locks orientation.

## State: runes only

`src/lib/settings.svelte.ts`, `src/routes/+page.svelte`

Svelte 5 runes only: `$state`, `$derived`, `$effect`. No stores, no `$app/stores`, which is deprecated as of SvelteKit 2.12 and disappears in SvelteKit 3, so any use of it would be debt on arrival. Runes mode is forced project wide in `vite.config.ts`.

Shared settings are a module level class instance exposing getters and setters over a single `$state` object. Getters keep the reactivity working through a plain import while the underlying object stays encapsulated.

`$effect` is used for genuine side effects only: DOM writes, timers, storage writes, event listeners. Never to mirror one piece of state into another, which is what `$derived` is for. One pattern is worth pointing out because it looks accidental: the tick effect in `+page.svelte` reads `settings.use24h` and `settings.showSeconds` at the top. That is deliberate. It makes them dependencies, so flipping either one tears the effect down, clears the old timer and starts a fresh tick at the new step. The teardown is the mechanism, not a side note.

The View Transition API is not used. It hooks into navigation, and a single route app never navigates. The digit flips are CSS keyframes inside a component and have nothing to do with the navigation lifecycle. Adding it would be dead code that looks modern.

## Themes and font

Four CSS custom properties (`--bg`, `--card-bg`, `--digit-color`, `--accent`) switched by a `data-theme` attribute on `<html>`. Four curated presets plus the default. Switching a theme is one attribute assignment and zero component changes.

There is no color picker, and not only because the product rules forbid visible controls. A picker lets someone build an unreadable theme, or a bright one that burns the panel, which is the opposite of the point. Curated sets are sets that are known to work on an always on display. The attribute sits on `<html>` rather than a wrapper so the page background changes too, not just the cards.

Flip speed and font are global, not theme tokens. They are not a theme concern, and putting them in the token set would invite presets that disagree about motion.

The font is the system stack (`ui-sans-serif, system-ui, sans-serif`) at weight 700 with `font-variant-numeric: tabular-nums`. No font file ships. On the target device this resolves to Roboto, which has proper tabular figures at 700, so digits do not jump width as they change. Shipping Inter or Geist would be around 300 KB for eleven glyphs. Subsetting to digits and a colon would be about 5 KB and is defensible, but it adds a build step, a binary in the repo and a licence file to solve a problem nobody has reported. Pixel identical rendering across devices matters for marketing screenshots, not for a clock on one riser. Zero bytes and zero build steps wins until someone shows a device where it looks wrong.

Brightness is applied as `opacity` on the stage. Be clear about what that is: a screen side dim, not backlight control. The web cannot touch the device backlight, and the device brightness setting remains the real control.

## Why adapter-node and not adapter-static

This is the decision most likely to be questioned, so here it is plainly. A local first app with one prerendered route obviously wants `adapter-static`. It is not used, and the reason is a verified deployment constraint rather than a preference.

`adapter-static` was tried on this exact deployment and failed. The deploy target's static mode does not run a build: it copies a prebuilt directory out of the clone. `build/` is gitignored, so there is nothing to copy, and the deploy died with `failed to compute cache key: /build: not found`. The Node path then also needs the explicit `start` script in `package.json`, or the container exits 0 and the proxy serves 502.

The important part: this costs nothing at runtime. `src/routes/+layout.ts` sets `prerender = true` and `ssr = false`, so the Node process only ever hands a static prerendered shell to the browser. There is no server side rendering per request, no data loading, no server logic of any kind. It is a static file server that happens to be Node. The app is live and working; switching adapters would break a working deploy to satisfy an aesthetic preference.

If you deploy this yourself somewhere that builds from source, `adapter-static` is a fine swap. It is kept as is because of where this particular instance runs.

## Test strategy

Vitest, pure logic only. Two suites: the time formatting and tick schedule in `src/lib/clock.test.ts`, and the settings migration chain in `src/lib/settings.test.ts`. The tick tests use fake timers to assert that the scheduled delay is recomputed from the clock rather than reused as a constant.

Those are the two places where a silent bug can hide for weeks. An off by one in the boundary calculation surfaces once a day and is easy to miss. A bad migration destroys real settings with no server backup to restore from. Both are pure functions and run in milliseconds.

There is no Playwright, no component test and no visual regression suite. For a single page clock that would spend a browser download and CI minutes to assert that a div is on screen, and it still could not check the thing that actually needs eyes: whether the 3D flip renders correctly on a real Android panel. That verification is manual and is recorded here as manual.

## The refusal list

Things this app will not become, so nobody has to relitigate them in a pull request: timers, alarms, weather, calendar, music controls, accounts, sync, a color picker, any permanently visible control, any runtime dependency, any network call after the first load.

The settings that exist are the complete set: 12 or 24 hour, seconds on or off, date on or off, theme preset, brightness.

## Known gap

`registration.update()` is not currently wired to `visibilitychange`. The intended design is a plain update check when the page becomes visible, which is the real world case of the phone waking up. It is deliberately not tied to `afterNavigate`, because a single route app never navigates and that hook would never fire. As of this writing the check is not in the code, so a running install picks up a new version when the tab is closed and reopened. Anyone adding it should keep `skipWaiting` off.
