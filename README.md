# Flipclock

Eine Flip-Uhr als Webapp für ein Android-Handy im Hochformat, das dauerhaft in einer Halterung am Monitor-Riser steckt. Zeigt HH:MM im 24-Stunden-Format, sonst nichts.

## Lokal starten

```sh
npm install
npm run dev
```

Produktionsbau und Typprüfung:

```sh
npm run build
npm run check
```

Der Bau ist statisch (`adapter-static`), das Ergebnis liegt in `build/` und lässt sich auf jedem Webspace ablegen. Für den Wake Lock braucht die Seite HTTPS, auf `localhost` geht es auch ohne.

## Was der Nutzer am Handy selbst einstellen muss

Die Webapp hält das Display nur so weit wach, wie der Browser es erlaubt. Der zuverlässige Teil ist Systemsache:

1. **Als App installieren.** Im Chrome-Menü "Zum Startbildschirm hinzufügen". Nur dann greift der Fullscreen-Modus aus dem Manifest, und ein zweiter Tab kann den Wake Lock nicht mehr abräumen.
2. **Entwickleroption "Display aktiv lassen".** Einstellungen, System, Über das Telefon, siebenmal auf die Build-Nummer tippen, dann in den Entwickleroptionen "Bildschirm beim Laden aktiv lassen" einschalten. Das wirkt nur am Ladekabel, ist dafür aber deutlich verlässlicher als die Wake-Lock-API.
3. **Dauerhaft am Ladekabel.** Ohne Strom greift Punkt 2 nicht.
4. **Bildschirm-Timeout** auf den längsten Wert stellen.
5. **Adaptive Helligkeit aus**, Helligkeit fest auf 10 bis 20 Prozent. Sonst dimmt das Handy nachts auf null und die Uhr ist unlesbar. Die niedrige Helligkeit ist zugleich der wichtigste Schutz gegen Einbrennen.
6. **Automatisches Drehen aus**, damit das Bild bei einer Berührung nicht kippt.

Zur Hardware: nimm ein altes Gerät, das du nicht mehr täglich brauchst, und lass die Hülle weg. Laden und Display gleichzeitig erzeugen Wärme, und über 45 Grad leidet der Akku dauerhaft.

Vollbild ohne Status- und Navigationsleiste gibt Android einer Webseite nicht. Das ginge nur über ein MDM-System. Ein Tipp auf die Uhrfläche schaltet den Browser-Vollbildmodus um, mehr ist per Web-API nicht drin.

## Bewusste Entscheidungen

**Kein Tailwind.** Die ganze App besteht aus einer Karte und einer Seite. Die Maße hängen an ein paar CSS-Variablen, die Flip-Animation braucht eigene Keyframes. Utility-Klassen hätten hier nichts gekürzt, nur eine Abhängigkeit und einen Build-Schritt dazugestellt. Plain CSS in `app.css` plus scoped styles reicht.

**Kein motion-sv.** Die Klappbewegung läuft einmal durch und wird nie unterbrochen. Genau dafür sind CSS-Keyframes gebaut. Eine Animationsbibliothek würde nur Bundle-Gewicht bringen, ohne dass ihre Stärke (unterbrechbare Federn) je zum Tragen käme.

**Driftfreier Tick statt `setInterval(1000)`.** Jeder Tick rechnet aus `Date` die Restzeit bis zur nächsten Minute und setzt dafür ein frisches `setTimeout`. Ein blindes Intervall läuft unter Last langsam weg. Weil die Zeit bei jedem Tick neu aus `Date` gelesen wird, holt die Uhr nach einer Pause im Hintergrund den echten Wert und feuert keine Salve von Einzelschritten nach.

**Sekunden aus.** `SHOW_SECONDS` in `src/lib/clock.ts` steht auf `false`. Eine zweite laufende Zahl zerstört die Ruhe, die eine Flip-Uhr ausmacht. Wer sie will, setzt die Konstante auf `true`, dann erscheint eine halb so große, gedimmte Karte, und der Tick stellt sich automatisch auf Sekunden um.

**Schwarz auf ganzer Fläche.** Ausgeschaltete OLED-Pixel verbrauchen keinen Strom und altern nicht. Dazu wandert die Uhr alle drei Minuten um bis zu zwei Pixel, über acht Sekunden hinweg. Das sieht niemand, verteilt aber die Last auf den hellen Ziffern.

**Zeit steht als Text im DOM.** Ein `aria-live`-Absatz nennt die Uhrzeit im Klartext, die Karten selbst sind für Screenreader ausgeblendet. Die Uhr ist damit nicht bloß eine Grafik aus CSS-Kästen.

**`prefers-reduced-motion` schaltet die Klappe ab.** Dann wechselt die Zahl hart, und auch der Pixel-Shift springt ohne Übergang.

## Dateien

| Datei | Zweck |
|---|---|
| `src/lib/clock.ts` | Zeit lesen, formatieren, driftfrei ticken. Hier stehen die Konstanten. |
| `src/lib/wakelock.ts` | Wake Lock anfordern, nach Sichtbarkeitswechsel erneuern, freigeben. |
| `src/lib/FlipCard.svelte` | Eine Karte mit zwei Ziffern, vier Schichten, CSS-Keyframes. |
| `src/routes/+page.svelte` | Uhr zusammensetzen, Tick, Wake Lock, Pixel-Shift, Vollbild-Tipp. |
| `src/app.css` | Globale Maße, echtes Schwarz, `sr-only`. |
| `static/manifest.webmanifest` | PWA: Vollbild, Hochformat, schwarz. |
