# CLAUDE.md

Agent contract for this repository. Read it before you change anything here.

## What this is

A flip clock webapp for a phone that lives in a holder on a desk. It is looked at, never operated. SvelteKit 2 with Svelte 5, Tailwind v4, shadcn-svelte for controls, a small handful of source files, Node 24 LTS. Live at flip.enisdev.com.

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
pnpm install      # Node 24 LTS
pnpm dev          # dev server
pnpm build        # production build into build/
pnpm start        # serve the build (node build/index.js)
pnpm preview      # vite preview
pnpm check        # svelte-check, must be 0 errors and 0 warnings
pnpm check:watch
pnpm test         # vitest, single run
pnpm test:watch
pnpm test:e2e     # playwright, builds and serves the app itself
```

`pnpm check` at 0/0 plus a passing `pnpm test` and `pnpm test:e2e` are the bar for any change.

## Testing

Vitest covers pure logic: time formatting, the tick schedule against fake timers, the gesture recogniser, the settings migration chain. Playwright covers behaviour in `e2e/`, running against the production build it starts itself: faces, gestures, settings, persistence, offline. Whether the 3D flip LOOKS right is still a manual check on a real Android device, and no headless browser replaces that. `pnpm check`, `pnpm test` and `pnpm test:e2e` are the bar.

## Svelte MCP

Configured in `.mcp.json` as a stdio server (`npx -y @sveltejs/mcp`). The wording below is the one Svelte recommends for this file, see [svelte.dev/docs/ai](https://svelte.dev/docs/ai).

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

The server also ships a `svelte-task` prompt. Use it if your client supports prompts.

## Further reading

Design decisions and their reasoning: `docs/architecture.md`. A condensed map of the source files for agents: `static/llms.txt`.
