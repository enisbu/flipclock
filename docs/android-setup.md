# Android always on setup

The honest version first: the webapp can only keep the display awake as far as the browser permits, and the browser permits less than you would like. The reliable part of an always on clock is a system setting on the device, not code in the app. The Wake Lock API is a request that the lock screen, an incoming call or battery saver can revoke at any time. Treat it as a convenience and set up the device properly.

This takes about five minutes and you do it once.

## 1. Install it as a PWA

Open the clock in Chrome, then use the browser menu and choose "Add to Home Screen" (also called "Install app"). Launch it from the new home screen icon from now on, not from a browser tab.

This matters for two reasons. The manifest asks for fullscreen display, and that only applies to an installed app: in a normal tab the browser keeps its own chrome on screen regardless. And an installed app runs in its own window, so a second tab in the browser can no longer take the wake lock away from it.

## 2. Turn on "Stay awake while charging"

This is the setting that actually keeps the screen on, and it beats anything the app can do from JavaScript.

Open Settings, go to About phone, and tap the build number seven times to unlock Developer options. Then open Developer options and enable "Stay awake" (on some devices "Keep screen on while charging"). It only works while the device is on a cable, which is fine, because the phone is going to live on the charger anyway.

## 3. Keep it on the charger

An always on display drains a battery in a few hours. The device stays plugged in permanently. The "Stay awake" option depends on it as well.

## 4. Screen timeout to maximum

Settings, Display, Screen timeout: pick the longest value your device offers. This is a backstop for the moments when the wake lock is not held.

## 5. Adaptive brightness off, brightness low

Settings, Display: turn off adaptive brightness, then set the slider manually to somewhere between 10 and 20 percent.

Do both parts. With adaptive brightness on, the phone dims itself in a dark room until the clock is unreadable at exactly the time you most want to read it, and it brightens again on a sunny afternoon when you do not need it.

The low fixed setting is also the single most important thing you can do about burn in. A static clock on an OLED panel at eight hours a day shows visible burn in within six to twelve months, and pixels age roughly two to three times faster at full brightness. The app's pixel shift helps at the margin, but brightness is the decision that determines whether the panel survives. Low is better in every respect: it looks right in a dim room, it ages the panel slower and it runs cooler.

## 6. Auto rotate

The app handles both orientations now, so this is a matter of taste. If you want it fixed in the holder, turn auto rotate off with the phone in the orientation you want. If you leave it on, the layout reflows on its own: portrait stacks the cards, landscape puts them side by side.

## Hardware note

Use an old phone you no longer need day to day, and take the case off.

Charging continuously while driving a display generates heat, and a case traps it. Sustained temperatures above roughly 45 degrees Celsius do permanent damage to a lithium battery, and permanent means it does not come back when the phone cools down. A bare phone in an open holder with some airflow runs meaningfully cooler than the same phone in a case. If the device gets noticeably warm to the touch, lower the brightness further and check that nothing is covering the back.

An old phone is the right choice for another reason too: you are deliberately burning display hours on a panel that will show a static image for months. Do not do that to a phone you still care about.

## The limitation, stated plainly

True kiosk fullscreen, with the Android status bar and navigation bar gone, is not reachable from a web app. No web API exposes it. Getting there requires an MDM or a dedicated kiosk launcher, which is a different kind of project and out of scope for this one.

What you get instead: a tap anywhere on the clock toggles the browser's fullscreen mode, and installing as a PWA removes the browser chrome. That is the ceiling, and the docs would rather say so than imply otherwise.

## If it still goes to sleep

Work down this list in order:

1. Check it is running from the home screen icon, not a browser tab.
2. Check the cable is actually charging, not just connected. "Stay awake" does nothing on battery.
3. Check battery saver is off. It revokes wake locks regardless of everything else.
4. Check the site is served over HTTPS. The Wake Lock API refuses to work outside a secure context, though `localhost` counts as secure for local testing.
5. Check that Android has not put the app to sleep under battery optimisation. Settings, Apps, the installed clock, Battery: set it to unrestricted.
