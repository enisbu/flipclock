# Contributing

Fork the repo on GitHub, clone your fork and create a branch. Pull requests go against `main`.

You need Node 22 LTS. Run `npm install`, then `npm run dev` for the dev server. The clock fills the viewport, so resize the window to check both orientations. The service worker only has real assets in a production build, so test offline behaviour with `npm run build` followed by `npm start` rather than in dev.

Before you open a pull request, `npm run check` must exit with 0 errors and 0 warnings and `npm test` must pass. Tests cover pure logic only: time formatting, the drift free tick schedule against fake timers, and the settings migration chain. There is no browser based test suite, so whether the 3D flip still renders correctly is a manual check on a real device. Say in the pull request which device you checked it on.

One thing to know before you write code: this app refuses features on purpose. It is a clock for a phone that is looked at and never operated, so the interface stays naked. Nothing is visible at rest except the clock, and every setting hides behind a gesture and fades away again. There is no settings gear, no toolbar, no panel. Alarms, weather, calendar, music control, accounts, sync and color pickers are out of scope, and pull requests in those directions will be declined however well they are written. The clock keeps five settings: 24 hour time, seconds, subline, theme preset, brightness. The focus face adds only its duration. Dependencies beyond Tailwind and shadcn-svelte are declined unless they solve a problem that stack cannot. Open an issue before building anything large, so nobody wastes an afternoon.
