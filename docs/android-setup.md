# Android always-on setup

The app holds a screen wake lock, and in practice that is enough: installed as a PWA, on a charger, with battery saver off, the screen simply stays on. The Wake Lock API is a request though, not a guarantee, and the lock screen, an incoming call or battery saver can revoke it. The steps below make it survive those moments. Five minutes, once.

1. **Install as a PWA.** Chrome menu, "Add to Home Screen", then launch from the icon, not from a tab. Only an installed app gets fullscreen display and its own window, so another tab cannot take the wake lock away.
2. **Keep it on the charger.** An always-on display drains a battery in hours.
3. **Screen timeout to maximum**, as a backstop for the moments the wake lock is not held.
4. **Optional, if the screen still sleeps: developer options, "Stay awake".** Tap the build number in About phone seven times to unlock developer options, then enable "Stay awake" (on some devices "Keep screen on while charging"). It beats anything JavaScript can do, but it only works on a cable, and most phones never need it.
5. **Adaptive brightness off, slider to 10 to 20 percent.** Adaptive dims the clock unreadable in a dark room. The low fixed value is also the main defense against OLED burn-in: a static image at eight hours a day burns in within months, and pixels age two to three times faster at full brightness. The app's pixel shift only helps at the margin.
6. **Auto rotate to taste.** The layout handles both orientations: portrait stacks the cards, landscape puts them side by side.

## Hardware

Take the case off. Continuous charging plus a lit display makes heat, a case traps it, and sustained heat above roughly 45 degrees Celsius damages the battery for good. For a display running many hours a day, a spare phone spares your daily one the burn-in.

## The limit

True kiosk fullscreen, with the Android status and navigation bars gone, is not reachable from a web app; that needs an MDM or a kiosk launcher. A tap toggles browser fullscreen and the installed PWA drops the browser chrome. That is the ceiling.

## If it still goes to sleep

1. Running from the home screen icon, not a tab?
2. Cable actually charging? "Stay awake" does nothing on battery.
3. Battery saver off? It revokes wake locks regardless.
4. Served over HTTPS? The Wake Lock API needs a secure context (`localhost` counts).
5. Battery optimisation: Settings, Apps, the clock, Battery, set to unrestricted.
