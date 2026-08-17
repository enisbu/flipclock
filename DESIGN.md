---
name: Flipclock
description: A two-color flip clock and focus timer for an always-on phone, flat at rest, operated only by gesture.
colors:
  ground: "#000000"
  plate: "#121212"
  digit: "#ededed"
  accent: "#d4d4d4"
  warm-plate: "#17120b"
  warm-digit: "#e8d5b0"
  warm-accent: "#d9b98a"
  night-plate: "#0a0a0a"
  night-digit: "#4a4a4a"
  night-accent: "#8a8a8a"
  slate-ground: "#0d1117"
  slate-plate: "#1c2128"
  slate-digit: "#adbac7"
  slate-accent: "#539bf5"
  sheet-surface: "oklch(0.205 0 0)"
  sheet-foreground: "oklch(0.985 0 0)"
  sheet-muted: "oklch(0.708 0 0)"
  sheet-track: "oklch(0.269 0 0)"
  sheet-border: "oklch(1 0 0 / 10%)"
  sheet-input: "oklch(1 0 0 / 15%)"
typography:
  display:
    fontFamily: "Clock Digits, ui-sans-serif, system-ui, sans-serif"
    fontSize: "calc(var(--card-w) * 0.62)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0"
    fontFeature: "tabular-nums"
  caption:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.8rem, 3.2vmin, 1.25rem)"
    fontWeight: 500
    letterSpacing: "0.22em"
  micro:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.6875rem, 2.2vmin, 0.875rem)"
    fontWeight: 500
    letterSpacing: "0.02em"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  plate: "clamp(0.75rem, 2.2vw, 1.5rem)"
  plate-row: "clamp(0.6rem, 1.4vw, 1.5rem)"
  segment: "0.5rem"
  control: "0.625rem"
  tile: "0.875rem"
  group: "1.125rem"
  sheet: "1.375rem"
spacing:
  seam: "clamp(2px, 0.35vw, 4px)"
  seam-row: "clamp(2px, 0.2vw, 4px)"
  plate-gap: "clamp(0.6rem, 3vw, 1.6rem)"
  plate-gap-row: "clamp(0.8rem, 4vw, 3rem)"
  group-inline: "1rem"
  sheet-inline: "1.25rem"
  row-height: "3rem"
components:
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.digit}"
    rounded: "{rounded.plate}"
    typography: "{typography.display}"
    width: "min(94vw, 34rem)"
    height: "calc(var(--card-w) * 0.7)"
  plate-seconds:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.plate}"
    width: "calc(var(--card-w-base) / 2)"
    height: "calc(var(--card-h-base) / 2)"
  settings-sheet:
    backgroundColor: "{colors.sheet-surface}"
    textColor: "{colors.sheet-foreground}"
    rounded: "{rounded.sheet}"
    padding: "0.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom))"
    width: "min(26rem, 100%)"
  settings-group:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    rounded: "{rounded.group}"
    padding: "0 1rem"
  segment-track:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    rounded: "{rounded.control}"
    padding: "0.125rem"
  segment-selected:
    backgroundColor: "rgba(255, 255, 255, 0.10)"
    textColor: "#ffffff"
    rounded: "{rounded.segment}"
    padding: "0.375rem 0"
    typography: "{typography.label}"
  segment-unselected:
    backgroundColor: "transparent"
    textColor: "rgba(255, 255, 255, 0.60)"
    typography: "{typography.label}"
  choice-tile:
    backgroundColor: "transparent"
    textColor: "rgba(255, 255, 255, 0.65)"
    rounded: "{rounded.tile}"
    padding: "0.625rem 0.25rem 0.5rem"
  choice-tile-selected:
    backgroundColor: "transparent"
    textColor: "rgba(255, 255, 255, 0.90)"
    rounded: "{rounded.tile}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.sheet-foreground}"
    rounded: "{rounded.segment}"
    padding: "0 0.625rem"
    height: "1.75rem"
  switch-on:
    backgroundColor: "{colors.accent}"
    height: "18.4px"
    width: "32px"
  switch-off:
    backgroundColor: "{colors.sheet-input}"
    height: "18.4px"
    width: "32px"
  slider-range:
    backgroundColor: "{colors.accent}"
    height: "0.25rem"
  slider-track:
    backgroundColor: "{colors.sheet-track}"
    height: "0.25rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.sheet-foreground}"
    rounded: "{rounded.control}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
---

# Design System: Flipclock

## Overview

**Creative North Star: "The Instrument"**

Flipclock is read, not used. It lives on an old phone in a desk holder, glanced at from an arm's length in a dim room, for hours at a time. The whole design follows from that: the screen at rest is one face on black and nothing else, no chrome, no buttons, no branding, no affordance. Every control hides behind a 600 ms long press and the sheet that appears dismisses itself after twelve idle seconds, so the resting state is the only state the owner ever really sees.

The category default was tried and rejected. Skeuomorphic split-flap machinery, gradients on the plates, hinge pins, heavy display faces: all of it is out. What is left is a plate color, a digit color, and a hairline of background showing through where the fold would be. Depth exists for exactly 700 ms while a flap turns, and nowhere else. Two faces, the clock and the focus timer, sit on the same plates in a swipe carousel, so the app never grows a second visual language.

Color enters in exactly one place: inside the settings sheet, where the theme's accent tints the switch, the slider range and the selected tile. The sheet itself is neutral dark chrome and should read as a small finished native product rather than as a config screen bolted onto a toy.

**Key Characteristics:**
- True black ground by default, because switched-off OLED pixels do not age
- Two colors per face: one plate, one digit
- Flat at rest; depth only while a flap moves
- Zero visible controls; gesture is the entire interface
- Every dimension derives from viewport width, never from height
- Self-hosted digit subset, equal advances, no network after first load

## Colors

Four curated presets, each a plate and a digit on a ground, plus one accent that never leaves the settings sheet. There is no color picker by product decision.

### Primary
- **Signal White** (`{colors.digit}`): the digits on the default theme. The single brightest ink in the app and the only thing meant to be read at a glance.
- **Quiet Accent** (`{colors.accent}`): control tint inside the settings sheet only. Bridged into the shadcn layer as `--primary` and `--ring`, so switch, slider range, selected tile border and every focus ring follow the active theme. Deliberately not the brightest surface in the app.

### Secondary
Theme accents, each paired to its preset and used under the same sheet-only restriction: **Amber Accent** (`{colors.warm-accent}`), **Ash Accent** (`{colors.night-accent}`), **Signal Blue** (`{colors.slate-accent}`). Slate is the one preset whose accent carries real hue; it is also the only preset that lifts the ground off pure black.

### Neutral
- **True Black** (`{colors.ground}`): page ground for default, Warm and Night.
- **Graphite Plate** (`{colors.plate}`): the default plate. Just far enough off black to read as a surface.
- **Warm Plate / Warm Digit** (`{colors.warm-plate}` / `{colors.warm-digit}`): a candle-lit set for evening use.
- **Night Plate / Night Digit** (`{colors.night-plate}` / `{colors.night-digit}`): a near-invisible set for a dark bedroom. Deliberately below any text contrast threshold. It is a glance surface, not text.
- **Slate Ground / Plate / Digit** (`{colors.slate-ground}` / `{colors.slate-plate}` / `{colors.slate-digit}`): the one cool, non-black set.
- **Sheet chrome** (`{colors.sheet-surface}`, `{colors.sheet-foreground}`, `{colors.sheet-muted}`, `{colors.sheet-border}`): the shadcn dark token set, used only inside the settings overlay.

### Named Rules
**The Two Color Rule.** A face is one plate color and one digit color on the ground. A third hue never touches a face. Adding a theme means adding a plate and a digit, nothing else.

**The Sheet Holds The Accent Rule.** `--accent` styles controls inside the settings overlay and the global focus ring. It never appears on the clock or the timer. If an accent is visible while the sheet is closed, that is a defect.

**The Black Ground Rule.** The ground is `#000` unless a preset explicitly lifts it (only Slate does, at `{colors.slate-ground}`). New presets default back to true black.

**The Subordinate By Size Rule.** The seconds plate is smaller, never dimmer as a whole. Only the digit is toned, by mixing 88% digit into the plate color; the plate keeps full contrast. Fading a whole plate greys the digits into it and reads as a rendering fault.

## Typography

**Display Font:** Clock Digits, a 1.5 KB self-hosted Roboto subset instanced at weight 600, ten glyphs, equal advances, shipped from the repo (fallback `ui-sans-serif, system-ui, sans-serif`, which resolves to the same face on the Android target)
**Body Font:** the system grotesk stack (`ui-sans-serif, system-ui, sans-serif`); there is no second webfont

**Character:** One neutral grotesk doing two jobs. Enormous and tabular on the plates, small and quiet everywhere else. Nothing is decorative and nothing is branded.

### Hierarchy
- **Display** (600, `calc(--card-w * 0.62)`, line-height 1, tracking 0, tabular): the digit pairs. The only type on a face at rest besides the optional subline.
- **Caption** (500, `clamp(0.8rem, 3.2vmin, 1.25rem)`, tracking `0.22em`, uppercase, opacity 0.6): the subline under the clock, date or the owner's own text. One line, ellipsized, never wrapped.
- **Micro** (500, `clamp(0.6875rem, 2.2vmin, 0.875rem)`, tracking `0.02em`, lowercase, opacity 0.6): the one-time gesture hint. Deliberately dressed unlike the caption so an instruction is not mistaken for a permanent label.
- **Title** (600, `0.9375rem`): the settings sheet header.
- **Body** (400, `0.9375rem`): settings row labels.
- **Label** (500, `0.8125rem`, muted foreground): settings group labels and segment text.

### Named Rules
**The Zero Tracking Rule.** Digit `letter-spacing` is `0`. CSS applies tracking after the final glyph too, so any non-zero value drags a centered pair off center by half of it.

**The Optical Center Rule.** Digits are nudged `0.012em` down inside their box. Flex centers the line box, not the ink, and at line-height 1 the pair otherwise sits above the seam. Verified against a rendered screenshot, not derived from metrics.

**The One Face Rule.** Both faces use the same digit face, weight and advance. A face is distinguished by what it shows and by its signature line, never by its type.

## Layout

Two faces sit in a full-bleed swipe carousel; each face centers its content on the stage. The stage carries the safe-area inset padding and the whole brightness dim (`opacity` on the stage, since the web cannot reach the device backlight).

**Every plate dimension hangs off viewport width alone.** Entering fullscreen on Android hides the URL bar and the gesture bar, which grows the viewport height by 20 to 80px. Anything derived from a height unit recomputes and the clock visibly jumps under the thumb that just tapped it; `vh`, `dvh`, `svh` and `lvh` all move by the same amount, so switching height units fixes nothing.

Two branches, chosen by aspect ratio rather than orientation so a near-square viewport (tablet, split screen, desktop window) does not stack a column taller than the screen:

- **Stacked** (below `10 / 16`): plates in a column, each at `min(94vw, 34rem)`, gap `{spacing.plate-gap}`, seam `{spacing.seam}`.
- **Row** (`min-aspect-ratio: 10 / 16`): plates side by side, dividing `94vw` minus the gaps by `--row-units` (2, or 2.5 when the half-size seconds plate is on), capped at `30rem`. Gap `{spacing.plate-gap-row}`, seam `{spacing.seam-row}`, tighter corner radius.
- **Letterbox** (`min-aspect-ratio: 5 / 2`): the only place a height cap engages, `min(30rem, 78dvh / 0.7)`. A landscape phone is about 2.2 wide and never reaches this branch, so no device that toggles browser chrome on a tap can jump.

The three size tokens resolve on `.plate-row`, never at `:root`: a custom property substitutes in the scope of the element that uses it, so a row's own `--row-units` override only reaches the formula there.

The plate is a quiet rounded rectangle slightly wider than tall (`--plate-aspect: 0.7`), with the digit pair filling `0.62` of the plate width. Both ratios are optical, verified against a screenshot.

Settings sheet geometry: bottom sheet at `min(26rem, 100%)` with top corners rounded, becoming a centered `22rem` panel with all corners rounded from `40rem` width. Under `30rem` viewport height (a phone in landscape) the panel becomes a two-column grid at `min(38rem, 94vw)`, so the slider never ends up behind a scrollbar.

### Named Rules
**The Width Only Rule.** No plate size, digit size, gap or radius may derive from a height unit. The single exception is the `5 / 2` letterbox cap, which no chrome-toggling device reaches.

**The Aspect Not Orientation Rule.** Layout branches go through `min-aspect-ratio`. `orientation` is never the query.

## Elevation & Depth

The system is flat. A resting plate has a background color, a radius, and nothing else: no shadow, no border, no gradient, no inner highlight. Surfaces separate by tone alone, and the fold is the ground showing through rather than a drawn line.

Depth appears in exactly three places, all of them transient or modal.

### Shadow Vocabulary
- **Flap wash** (`background: #000`, opacity animated `0 to 0.55` over the flip, `linear`): the entire depth model of the clock. The falling half darkens as it turns away, the arriving half lightens as it swings into the plane. Only the moving flap ever carries it.
- **Sheet lift** (`box-shadow: 0 -1rem 3rem rgba(0, 0, 0, 0.6)`): the settings sheet against the face behind it.
- **Backdrop** (`background: rgb(0 0 0 / 0.7)`): pushes the face back while the sheet is open.

### Named Rules
**The Flat At Rest Rule.** Nothing that is not moving casts anything. If a surface needs a shadow to be legible, its tone is wrong.

## Shapes

Rounded rectangles throughout, at a small radius scale that grows with the surface: segment `{rounded.segment}`, control `{rounded.control}`, tile `{rounded.tile}`, group `{rounded.group}`, sheet `{rounded.sheet}`. Plate corners are fluid (`{rounded.plate}` stacked, tighter `{rounded.plate-row}` in a row) so a large plate does not read as a pill.

A plate is two halves and a seam, not a card with a line across it. Each half is clipped and carries the top or bottom corner pair only; the seam is a gap of pure ground, `{spacing.seam}` tall, sitting exactly on the plate's midline. The digit box inside each half is double height and clipped, which puts the glyph edge precisely on the fold.

Borders exist only inside the settings sheet: `1px` dividers between rows in a group, `1px` outlines on choice tiles (`rgb(255 255 255 / 0.1)` unselected, the theme accent when selected).

### Named Rules
**The Hairline Seam Rule.** The fold is 2 to 4px of background showing through. It is never a drawn stroke, a shadow, a bevel, or a hinge. Thin enough to read as a fold, not as machinery.

## Components

### Flip Plate
The system's one real primitive. A static top half and bottom half with the seam between them; two animated flaps exist only while the value changes and are removed afterwards.
- **Shape:** rounded rectangle, aspect `0.7`, corners `{rounded.plate}`
- **Color:** `{colors.plate}` surface, `{colors.digit}` ink, no border
- **States:** flipping (two flaps plus wash, 700 ms), resting (flat)
- **Reduced motion:** flaps are never rendered; the digit swaps

### Focus Progress Line
The focus face's signature and the only thing that tells the two faces apart at a glance.
- **Style:** `2px` tall, `1px` radius, digit color at `0.6` opacity, spanning one plate stacked and the full pair in a row
- **Behavior:** full width at rest, scaled down on the X axis as the countdown runs, `1s linear`. Scaled rather than resized, so nothing relayouts every second
- **Done state:** the plates pulse twice, then the line breathes between `0.75` and `0.2` opacity indefinitely, so a later glance reads "done" rather than a clock stuck at 00:00

**The One Line Rule.** Only the focus face carries a line. The clock never does, so `23:45` remaining can never be misread as a quarter to midnight.

### Settings Sheet
The only operable surface in the app. Summoned by a 600 ms long press, dismissed by tap-outside, Escape, the Done button, or 12 seconds of idle.
- **Corner Style:** top corners `{rounded.sheet}` as a bottom sheet, all four when centered
- **Background:** `{colors.sheet-surface}` with the sheet lift shadow over a 70% black backdrop
- **Internal Padding:** `{spacing.sheet-inline}` inline, `1.25rem` plus safe-area at the bottom
- **Grabber:** `2.25rem` by `4px` pill at `rgb(255 255 255 / 0.2)`, sheet form only
- **Header:** title left, ghost Done button right, `2.5rem` minimum height

### Setting Groups
Rows are grouped into tonal boxes rather than separated by headers.
- **Style:** `rgb(255 255 255 / 0.04)` fill, `{rounded.group}` corners, `{spacing.group-inline}` inline padding, `1px` dividers between rows
- **Row:** `{spacing.row-height}` minimum height, body-size label left, control right

**The Alpha Chrome Rule.** Sheet surfaces layer by white alpha on the popover ground: `0.04` group, `0.06` segment track, `0.10` selected segment, `0.10` borders, `0.20` grabber. That ladder is the sheet's entire depth language; do not reach for a new solid grey.

### Segmented Control
- **Style:** track at `rgb(255 255 255 / 0.06)`, `{rounded.control}`, `2px` inset padding; segments fill equally
- **Selected:** `rgb(255 255 255 / 0.10)` fill, white text, `{rounded.segment}`
- **Unselected:** transparent, `rgb(255 255 255 / 0.6)` text
- **Transition:** color only

### Choice Tiles (theme and duration)
- **Style:** transparent fill, `1px` border, `{rounded.tile}`, label under the swatch
- **Selected:** border switches to the theme accent; the label lifts to `rgb(255 255 255 / 0.9)`
- **Theme swatch:** a miniature plate, `3rem` by `2.25rem`, showing the preset's own plate and digit colors with the seam drawn across the middle. The theme is previewed as the thing it themes.
- **Duration tile:** the number at `1.125rem` semibold tabular, `min` beneath it

### Inputs and Controls
- **Text input:** transparent fill, `1px` `{colors.sheet-input}` border, `{rounded.control}`, `2rem` tall. Appears only when the subline is set to custom text
- **Switch:** `32px` by `18.4px` track, full radius; off is `{colors.sheet-input}`, on is the theme accent
- **Slider:** `{colors.sheet-track}` track, accent range, small white thumb
- **Focus:** `2px` accent outline at `2px` offset, global. The sheet container itself takes focus programmatically on open with the ring suppressed, so no visible ring lands on Done

### Gesture Surface
There is no navigation and no button on a face. The whole stage is one surface: tap runs the face's main action (fullscreen on the clock, start and pause on the timer), drag moves the carousel, long press opens the sheet. A pointer that travels more than `10px` cancels the press and swallows the trailing click. Keyboard runs off a window handler (arrows switch faces, Enter and Space act), so nothing focusable has to sit on the surface.

**The Empty Surface Rule.** At rest the screen is the active face on the ground and nothing else. A new capability gets a gesture and a row in the sheet, never a visible control on a face.

### Motion
- **Flip:** `700ms cubic-bezier(0.4, 0, 0.2, 1)`, `perspective: 90vmin`, top flap rotating out around its bottom edge while the bottom flap rotates in around its top
- **Carousel:** Embla at duration `20`
- **Sheet:** fly in `300ms` (`320px`) as a bottom sheet, `220ms` (`16px`) as a centered panel, out `200ms`, all `cubicOut`; backdrop fades `200ms`
- **Hint:** `900ms ease` opacity to `0.6`, held `4s`, faded out, then unmounted for good
- **Pixel shift:** up to 2px in each axis every 3 minutes, transitioned over `8s linear` so it is never noticed
- **Progress:** `1s linear`; done state pulses `scale(1.015)` twice over `600ms` then breathes at `2.4s`

**The Reduced Motion Rule.** Under `prefers-reduced-motion: reduce` everything that moves is removed rather than shortened: flaps are not rendered, the carousel duration is `0`, sheet transitions are `0`, the pixel shift jumps instead of gliding, the progress line does not tween, and the done state holds a static `0.75` opacity instead of breathing. The OLED pixel shift keeps running; it is a hardware protection, not decoration.

## Do's and Don'ts

### Do:
- **Do** derive every plate size, gap and radius from viewport width. A height unit in the size chain makes the clock jump when Android fullscreen hides its chrome.
- **Do** keep a face at two colors: one plate, one digit on the ground.
- **Do** put every new setting behind the long press, in a tonal group box, as a labelled row.
- **Do** preview a theme as a miniature plate with its own seam, not as a color dot.
- **Do** make a new element subordinate by size, and tone the ink alone if it also needs to recede.
- **Do** branch layout on `min-aspect-ratio`, matching the existing `10 / 16` and `5 / 2` breaks.
- **Do** remove motion entirely under `prefers-reduced-motion`, not merely shorten it.
- **Do** keep every asset local. There is no network after first load and no CDN font.

### Don't:
- **Don't** put a gradient, bevel, inner highlight, hinge pin or drawn hinge line anywhere. The skeuomorphic split-flap look was built and rejected by the owner.
- **Don't** add a shadow to a resting surface. The only shadows in the system are the moving flap's black wash and the settings sheet's lift.
- **Don't** show a control, icon, logo or label on a face. Gestures carry the interface, and the one-time hint fades out and unmounts.
- **Don't** let the accent out of the settings sheet, and don't make it the brightest thing on screen.
- **Don't** give the clock face a progress line, a bar, or any horizontal rule. That mark belongs to the focus face alone.
- **Don't** apply negative tracking to digits, and don't fade a whole seconds plate to make it recede.
- **Don't** add a color picker or a free-form duration field. Presets are the product decision.
- **Don't** thicken the seam into a visible stroke or draw it in anything other than the ground color.
- **Don't** introduce a second webfont or a display face. One grotesk does every job here.
