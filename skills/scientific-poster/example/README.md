# <Project> poster (A0 portrait)

- `<Name>_Poster_A0.pptx` – editable single-slide poster, 841 x 1189 mm.
- `<Name>_Poster_A0.pdf` – print PDF rendered with LibreOffice.
- `<Name>_Poster_A0_preview.jpg` – low-res preview.
- `poster.js` + `assets/` – pptxgenjs source to rebuild after text changes.
- `bg.js` – regenerates `assets/bg.png` (gradient + hexagon background) with sharp.
- `shots.js` – Playwright script that takes the UI screenshots.
- `backup/` – earlier layouts.

Rebuild:

    npm install pptxgenjs jszip
    PPTX_SKILL=~/.claude/skills/synced/<id>/pptx NODE_PATH=$PWD/node_modules node poster.js

Assets: <provenance of every logo, screenshot and illustration>.

Numbers come from <manuscript file> and <benchmark report>.
