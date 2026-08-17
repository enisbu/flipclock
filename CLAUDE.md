# CLAUDE.md

Agent contract for this repository. Read it before you change anything here.

## What this is

A flip clock webapp for a phone that lives in a holder on a desk. It is looked at, never operated. SvelteKit 2 with Svelte 5, Tailwind v4, shadcn-svelte for controls, a small handful of source files, Node 22 LTS. Live at flip.enisdev.com.

## Hard rules

- **English only.** README, code, comments, commit messages, docs, error messages, variable names. The repo is public and entirely English.
- **No em dashes and no en dashes**, not even in prose. Use a period, a comma, a colon or parentheses. No emojis anywhere.
- **The interface is naked.** At rest nothing is on screen but the clock on black. Every setting hides behind a gesture and fades away by itself. Never add a settings gear, a toolbar or a permanently visible control.
- **Runes mode only.** `$state`, `$derived`, `$effect`. No stores, no `$app/stores` (deprecated since SvelteKit 2.12). Runes are forced project wide in `vite.config.ts`. Use `$effect` for real side effects (DOM, timers, storage) and never to mirror state into state, which is what `$derived` is for.
- **No new dependencies** beyond the established stack (Tailwind v4, shadcn-svelte and what they bring) without a problem that stack genuinely cannot solve. New UI uses shadcn-svelte components, not hand-rolled controls.
- **Feature scope is closed.** Two faces: clock and focus timer, switched by swipe. Clock settings are five: 24 hour time, seconds, subline, theme preset, brightness; focus adds only its duration. No alarms, weather, calendar, music control, accounts, sync or color pickers.
- **Keep the existing behaviour**: drift free tick, wake lock with re acquire, fullscreen by gesture, OLED pixel shift, `prefers-reduced-motion`, time as real text in the DOM.
- **Do not switch the adapter.** `@sveltejs/adapter-node` with `prerender = true` and `ssr = false` is a verified deploy constraint, not a preference. `adapter-static` was tried on this deployment and failed.

## Commands

```sh
npm install       # Node 22 LTS
npm run dev       # dev server
npm run build     # production build into build/
npm start         # serve the build (node build/index.js)
npm run preview   # vite preview
npm run check     # svelte-check, must be 0 errors and 0 warnings
npm run check:watch
npm test          # vitest, single run
npm run test:watch
```

`npm run check` at 0/0 and a passing `npm test` are the bar for any change.

## Testing

Vitest covers pure logic only: time formatting, the tick schedule against fake timers, the settings migration chain. Whether the 3D flip renders correctly is a manual check on a real Android device, and no headless browser replaces it.

## Further reading

Design decisions and their reasoning: `docs/architecture.md`. A condensed map of the source files for agents: `static/llms.txt`.
