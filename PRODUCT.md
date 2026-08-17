# PRODUCT

Flipclock is a flip clock PWA for an old Android phone parked in a desk holder:
looked at all day, operated never. One route, no backend, no network after the
first load. Stack: Tailwind v4 and shadcn-svelte (owner decision 2026-08-17),
nothing beyond it.

- Audience: the owner, glancing from about an arm's length away, often in a dim
  room, on an OLED panel that runs for hours.
- Job: show the time legibly at a glance. Everything else is subordinate.
- Two faces in a swipe carousel (owner decision 2026-08-17): the clock and a
  focus timer on the same plates. Tap is the face's main action, no stats, no
  history.
- Surface rule: at rest the screen is the active face on black and nothing
  else. All controls hide behind a 600 ms long press; the settings sheet
  dismisses itself.
- Clock settings are capped at five: 24-hour time, seconds, subline (date or
  own text), theme preset, brightness. Focus adds only its duration. No color
  picker.
- Brand commitment (owner, 2026-08-17): minimalist and flat. Skeuomorphic
  split-flap machinery (gradients, hinge pins, heavy display faces) was tried
  and rejected. The settings sheet should feel like a finished product, quiet
  and native in tone.
- Constraints: true black default for OLED, pixel shift stays, wake lock stays,
  prefers-reduced-motion respected, no CDN assets, mode is Operate.
