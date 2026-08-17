#!/usr/bin/env python3
"""Build the subset split-flap face from the Archivo variable source.

Why this exists at all: a split-flap board needs every digit to occupy the same
cell and to sit optically dead centre in it. CSS tabular-nums equalises advance
widths but leaves the sidebearings alone, so the ink of a 1 still sits off
centre inside its cell and the whole string wanders as the minute changes. That
is a font level problem and it gets a font level fix here.

Steps:
  1. instance the variable font at Expanded Black, the Solari plate weight
  2. keep only the ten digits, the colon and the space
  3. give every digit the same advance and centre its ink inside that advance
  4. flatten the vertical metrics so line-height 1 puts the cap height in the
     middle of the line box with no descender room stealing space

Run with: python3 tools/build-font.py
Requires fonttools and brotli, neither of which ships in package.json: the
output woff2 is committed, so this script only runs when the face changes.
"""

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.varLib.instancer import instantiateVariableFont

SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/fonts/Archivo.ttf")
TARGET = Path(__file__).resolve().parent.parent / "static" / "split-flap.woff2"

# Expanded Black. Wide, heavy, flat sided: the plate look of a Solari board.
LOCATION = {"wght": 900, "wdth": 125}
KEEP = "0123456789: "


def main() -> None:
    font = TTFont(SOURCE)
    instantiateVariableFont(font, LOCATION, inplace=True, updateFontNames=False)

    options = Options()
    options.layout_features = []
    options.name_IDs = [1, 2, 3, 4, 6]
    options.notdef_outline = False
    options.drop_tables += ["DSIG"]
    options.recalc_bounds = True
    subsetter = Subsetter(options=options)
    subsetter.populate(text=KEEP)
    subsetter.subset(font)

    normalise_digits(font)
    flatten_vertical_metrics(font)
    rename(font, "Split Flap")

    font.flavor = "woff2"
    font.save(TARGET)
    print(f"wrote {TARGET} ({TARGET.stat().st_size} bytes)")


def normalise_digits(font: TTFont) -> None:
    """One advance for all ten digits, ink centred inside it.

    The advance is the widest digit ink plus a small even sidebearing, so no
    glyph is squeezed and none of them can drift left or right of the cell.
    """
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    glyf = font["glyf"]

    names = [cmap[ord(d)] for d in "0123456789"]
    widest = max(glyf[n].xMax - glyf[n].xMin for n in names)
    # A tight flank, 1.5 percent of the em on each side. Any wider and the pair of
    # digits stops filling the plate; the widest digit sets the floor here, so
    # this is close to the narrowest honest cell the face allows.
    advance = widest + 2 * round(upm * 0.015)

    for name in names:
        glyph = glyf[name]
        ink = glyph.xMax - glyph.xMin
        target_lsb = round((advance - ink) / 2)
        glyph.coordinates.translate((target_lsb - glyph.xMin, 0))
        glyph.recalcBounds(glyf)
        hmtx[name] = (advance, glyph.xMin)

    # The colon rides in a narrow cell of its own, also centred.
    colon = cmap.get(ord(":"))
    if colon is not None:
        glyph = glyf[colon]
        ink = glyph.xMax - glyph.xMin
        colon_advance = round(advance * 0.42)
        target_lsb = round((colon_advance - ink) / 2)
        glyph.coordinates.translate((target_lsb - glyph.xMin, 0))
        glyph.recalcBounds(glyf)
        hmtx[colon] = (colon_advance, glyph.xMin)


def rename(font: TTFont, family: str) -> None:
    """The subset is no longer Archivo, so it does not carry Archivo's name.

    The OFL allows the derivative but the reserved name rule means the shipped
    file must say what it is. Attribution stays in static/split-flap.LICENSE.txt.
    """
    postscript = family.replace(" ", "")
    for record in font["name"].names:
        if record.nameID in (1, 16):
            record.string = family
        elif record.nameID in (2, 17):
            record.string = "Regular"
        elif record.nameID == 4:
            record.string = family
        elif record.nameID == 6:
            record.string = postscript


def flatten_vertical_metrics(font: TTFont) -> None:
    """Make the line box hug the digits.

    The stock metrics reserve descender room that digits never use, which is
    what caps the fill ratio and pushes the numbers optically high inside the
    card. Digits have no descender, so the line box is set to the digit ink
    itself and line-height 1 then centres cap height exactly.
    """
    upm = font["head"].unitsPerEm
    glyf = font["glyf"]
    cmap = font.getBestCmap()
    names = [cmap[ord(d)] for d in "0123456789"]

    top = max(glyf[n].yMax for n in names)
    bottom = min(glyf[n].yMin for n in names)
    height = top - bottom
    # Split the leftover em evenly above and below the digit ink, so the ink
    # block is centred in the line box by construction.
    slack = upm - height
    ascent = top + slack // 2
    descent = ascent - upm

    hhea = font["hhea"]
    hhea.ascent = ascent
    hhea.descent = descent
    hhea.lineGap = 0

    os2 = font["OS/2"]
    os2.sTypoAscender = ascent
    os2.sTypoDescender = descent
    os2.sTypoLineGap = 0
    os2.usWinAscent = ascent
    os2.usWinDescent = -descent
    # fsSelection bit 7 tells the browser to use the typo metrics.
    os2.fsSelection |= 1 << 7


if __name__ == "__main__":
    main()
