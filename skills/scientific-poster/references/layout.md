# Layout spec (A0 portrait, inches; scale proportionally for A1)

Contents: canvas and columns, vertical budget, type scale, colour roles, content rules.

The layout follows the Orthonym conference poster: wordmark as the title, a full-width abstract
band, open sections separated by rules instead of boxed cards, a soft gradient background with a
hexagon motif. `example/poster.js` implements it; `example/reference-render.jpg` shows it.

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
| Header | 0.65–8.0 | wordmark w 17.0 at (1.0, 0.65); institution logo w 7.8 right-aligned, centred on the wordmark; paper title 40 pt bold, two balanced lines via `\n`, at y 4.7; authors 32 pt at y 6.35 (w 13); affiliations 21 pt, right-aligned at x 14.0, three lines ending with "* Correspondence to: mail" |
| Abstract | 8.5–14.4 | rotated accent tab (3.4 × 0.9, `rotate: 270`, shape and text separately) at x 1.45; abstract 25 pt justified, x 2.5 w 21.6, `lineSpacingMultiple 1.04`; two QR codes 2.7 in at x 25.1 and 28.9 with two-line labels; two italic URLs below |
| Row 2 | 15.0–32.6 | left: section title, illustration 11.0 wide (3:1), caption 20 pt italic grey, one-row legend, seven step boxes h 1.36 gap 0.32 with 23 pt bold title and 18 pt text, down arrows between; right: "Results" title, two halves each with a 28 pt sub-heading; half 1 three stat tiles h 2.5 (46 pt value, 18 pt label), stacked column chart h 8.2, two bullets 22 pt; half 2 horizontal bar chart h 7.0, table rowH 0.7 (21 pt), note 22 pt; both halves end with an italic accent takeaway at y R2B − 1.3 |
| Row 3 | 33.1–43.0 | left: section title, four pill rows h 1.6 (pill 3.5 × 0.8, outlined, first letter in the accent) with a bold 22 pt line and a grey 20 pt detail, a spine line, an italic closing line, "What comes next:" run-in bold at 20 pt; right: section title, two screenshots side by side with shadow, 18 pt italic captions, two bullets 22 pt |
| Footer | 43.5–46.3 | licence line 20 pt w 26; references 15 pt in two columns (w 12.6 and 13.4, y +0.95); funding 15 pt grey (y +2.15); "Built on" plus a library logo; "Contact" label and contact QR 2.55 in at x 29.55 |

## Type scale

Section titles 40 pt regular, centred over their column. Sub-headings 28 pt bold. Body 22–25 pt.
Captions and legends 18–20 pt. References and funding 15 pt. Chart text uses `"+mn-lt"` as the font
face. Nothing below 15 pt on A0. Calibri (or Arial) so the LibreOffice render predicts PowerPoint.

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
grid lines, shadows, table cell fills). Put the palette in `THEME` and apply it with `apply_theme.js`
after `writeFile`.

## Content rules

- One message per region; the takeaway lines carry the argument, the bullets carry the facts.
- Step boxes: title plus one or two lines, at most ~110 characters, or the box wraps to three lines.
- Table labels under ~30 characters, stat labels two short lines, chart titles one line at 22 pt.
- Screenshot captions under ~60 characters at 18 pt for an 8.9 in column.
- The abstract may be the manuscript abstract verbatim if it fits 11–12 lines at 25 pt in 21.6 in.
- Numbered markers only where the order is real (the pipeline); principles get pills, not numbers.
