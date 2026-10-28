# <Project> poster (A0 portrait)

- `<Name>_Poster_A0.pptx` – editable single-slide poster, 841 x 1189 mm.
- `<Name>_Poster_A0.pdf` – print PDF rendered with LibreOffice.
- `<Name>_Poster_A0_preview.jpg` – low-res preview.
- `poster.js` + `assets/` – pptxgenjs source to rebuild after text changes.
- `theme.js` – writes the poster palette into the pptx theme; `poster.js` loads it.
- `bg.js` – regenerates `assets/bg.png` (gradient + hexagon background) with sharp.
- `shots.js` – Playwright script that takes the UI screenshots.
- `backup/` – earlier layouts.

Rebuild:

    npm install pptxgenjs sharp
    node bg.js       # only when the background changes
    node poster.js
    python3 <skill>/scripts/fontcheck.py <Name>_Poster_A0.pptx   # nothing under 28 pt (7 pt on A4)

Assets: <provenance of every logo, screenshot and illustration>.

Numbers come from <manuscript file> and <benchmark report>. For each number: the file, line or
script that produces it, and what it is a share of.

The poster uses short references; the full list:

1. <Authors. Title. Journal Volume, Pages (Year).>

Hand edits: if the pptx was edited in PowerPoint after the last build, do not rebuild; change text
with `patch_text.py` and copy the change into `poster.js`.
