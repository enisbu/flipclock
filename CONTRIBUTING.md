# Contributing

Fork the repo on GitHub, clone your fork and create a branch. Pull requests go against `main`.

You need Node 22 LTS and pnpm, which the repo pins in `package.json`. Run `pnpm install`, then `pnpm dev` for the dev server. The clock fills the viewport, so resize the window to check both orientations. The service worker only has real assets in a production build, so test offline behaviour with `pnpm build` followed by `pnpm start` rather than in dev.

Before you open a pull request, `pnpm check` must exit with 0 errors and 0 warnings, `pnpm test` must pass, and so must `pnpm test:e2e`. The unit tests cover pure logic: time formatting, the drift free tick schedule against fake timers, the gesture recogniser, and the settings migration chain. The browser tests in `e2e/` drive the built app under playwright and cover behaviour: the faces, the gestures, the settings, offline. What none of them can judge is whether the 3D flip still LOOKS right, so that stays a manual check on a real device. Say in the pull request which device you checked it on.

`pnpm test:e2e` builds the app and starts it on port 4173 by itself, so it needs no running server. Chromium comes from `pnpm exec playwright install chromium` on a fresh machine.

One thing to know before you write code: this app refuses features on purpose. It is a clock for a phone that is looked at and never operated, so the interface stays naked. Nothing is visible at rest except the clock, and every setting hides behind a gesture and fades away again. There is no settings gear, no toolbar, no panel. Alarms, weather, calendar, music control, accounts, sync and color pickers are out of scope, and pull requests in those directions will be declined however well they are written. The clock keeps five settings: 24 hour time, seconds, subline, theme preset, brightness. The focus face adds only its duration. Dependencies beyond Tailwind and shadcn-svelte are declined unless they solve a problem that stack cannot. Open an issue before building anything large, so nobody wastes an afternoon.
