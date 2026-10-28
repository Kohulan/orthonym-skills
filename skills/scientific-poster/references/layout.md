# Layout spec (A0 portrait, inches; scale proportionally for A1; portrait only)

Contents: canvas and columns, vertical budget, type scale, colour roles, content rules.

The layout follows the Orthonym conference poster: wordmark as the title, a full-width abstract
band, open sections separated by rules instead of boxed cards, a soft gradient background with a
hexagon motif. `example/poster.js` implements it for the BChemXtract poster; `example/reference-render.jpg` shows
it. There is no landscape variant.

## Canvas and columns

| Item | Value |
|---|---|
| Canvas | `defineLayout({name:"A0P", width:33.11, height:46.81})`, then `pres.layout = "A0P"` |
| Margin M | 1.0; content right edge R = 32.11 |
| Left column | LX = 1.0, LW = 12.0 |
| Right column | RX = 13.8, RW = 18.31 (two halves of 8.755 with a 0.8 gutter) |
| Rules | 1.5 pt lines, colour C5CBD9, full content width, 0.35 in below a row and 0.25 above the next |
| Background | `example/bg.js` renders `assets/bg.png`; set it as the layout background (`background: {path}`) |

## Vertical budget

| Band | y (in) | Content |
|---|---|---|
| Header | 0.65–8.1 | wordmark w 17.0 at (1.0, 0.65); institution logo w 7.8 right-aligned, centred on the wordmark; paper title 52 pt bold, two balanced lines via `\n`, at y 4.7; authors 36 pt at y 6.6 (w 13); affiliations 28 pt, right-aligned at x 14.0, three short lines ending with "* mail" |
| Abstract | 8.6–13.6 | rotated accent tab (3.4 × 0.9, `rotate: 270`, shape and text separately) at x 1.45; abstract 30 pt justified, centred vertically, x 2.5 w 21.6, at most ~120 words; two QR codes 2.6 in at x 25.1 and 28.9 with one-word labels; two italic URLs below |
| Row 2 | 14.2–32.5 | left: section title, illustration 10.0 wide (3:1), caption 28 pt italic grey, legend two by two, seven step boxes h 1.22 gap 0.32 with 32 pt bold title and one 28 pt line, down arrows between; right: "Results" title, two halves each with a 32 pt sub-heading; half 1 three stat rows h 1.15 (54 pt value left, 28 pt two-line label right), stacked column chart h 8.4 with hidden value axis, two bullets 30 pt; half 2 horizontal bar chart h 7.6, table rowH 0.74 (28 pt), note 30 pt; both halves end with an italic accent takeaway at y R2B − 1.3 |
| Row 3 | 33.0–42.55 | left: section title, four pill rows h 1.62 (pill 3.4 × 0.85, outlined, first letter in the accent) with a bold 30 pt line and a grey 28 pt detail, a spine line, a one-line italic closing line, "Next:" run-in bold at 28 pt; right: section title, two screenshots side by side with shadow, 28 pt italic captions, two bullets 30 pt |
| Footer | 43.05–46.25 | licence line 28 pt w 26; short references 28 pt in two columns of three (w 12.6, y +0.7); funding 28 pt grey (y +2.25); "Built on" plus a library logo; "Contact" label and contact QR 2.55 in at x 29.55 |

## Type scale

The floor: nothing under 7 pt when the whole poster is printed on A4 and held at arm's length,
which is 28 pt on A0 (20 pt on A1). On A0: title 52 pt bold, section titles 48 pt regular centred
over their column, sub-headings and step titles 32 pt bold, body 30 pt, captions, legends, labels,
references, funding and all chart text 28 pt. Chart text uses `"+mn-lt"` as the font face and has
every size set (title, axes, data labels, legend); a chart default renders at 10–18 pt. Calibri (or
Arial) so the LibreOffice render predicts PowerPoint. `scripts/fontcheck.py` checks the floor.

The floor costs space: at 28 pt a line holds about 5.5 characters per inch of box width (Calibri).
Budget text by that before building, and shorten text that does not fit; never set it smaller.
The UI text inside a screenshot is part of the image and cannot meet the floor; give screenshots
space instead (`references/content.md`).

## Colour roles

Take the institution's brand colours; the example uses navy, magenta and teal. Roles:

| Role | Example hex |
|---|---|
| primary (titles, step boxes "library", table header) | 072563 |
| accent (tab, takeaways, "published output", pins) | C61354 |
| secondary (principle pills, "editorial workflow", third stat) | 096779 |
| mid (arrows, affiliations) | 5B7FB5 |
| pale (input boxes, second chart series) | B9C7E0 |
| very pale (table zebra) | E3E8F1 |
| grey text | 6B7390 |

Use `pres.SchemeColor` for shapes and text; hex only where pptxgenjs demands it (chart colours,
grid lines, shadows, table cell fills). Put the palette in `THEME` and apply it with `theme.js`
after `writeFile`.

## Content rules

- One message per region; the takeaway lines carry the argument, the bullets carry the facts.
- Step boxes: a title plus one line of at most ~60 characters at 28 pt in a 12 in column.
- Table labels under ~20 characters; stat labels two lines of ~22 characters; chart titles one line
  of ~45 characters in an 8.8 in half column; value columns hold numbers, the chart holds percentages.
- Screenshot captions under ~40 characters at 28 pt for an 8.9 in column.
- The abstract is a ~120-word version of the manuscript abstract with all of its numbers; the
  full text does not fit at 30 pt.
- References in short form, at most 7, the full list in the README.
- Numbered markers only where the order is real (the pipeline); principles get pills, not numbers.
- More rules on numbers, wording and redesigns: `references/content.md`.
