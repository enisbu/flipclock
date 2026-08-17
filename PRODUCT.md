# PRODUCT

Flipclock is a flip clock PWA for an old Android phone parked in a desk holder:
looked at all day, operated never. One route, no backend, no network after the
first load, zero runtime dependencies.

- Audience: the owner, glancing from about an arm's length away, often in a dim
  room, on an OLED panel that runs for hours.
- Job: show the time legibly at a glance. Everything else is subordinate.
- Surface rule: at rest the screen is the clock on black and nothing else. All
  controls hide behind a 600 ms long press; the settings sheet dismisses itself.
- Settings are capped at five: 24-hour time, seconds, date, theme preset,
  brightness. No color picker, no sixth setting.
- Brand commitment (owner, 2026-08-17): minimalist and flat. Skeuomorphic
  split-flap machinery (gradients, hinge pins, heavy display faces) was tried
  and rejected. The settings sheet should feel like a finished product, quiet
  and native in tone.
- Constraints: true black default for OLED, pixel shift stays, wake lock stays,
  prefers-reduced-motion respected, no CDN assets, mode is Operate.
