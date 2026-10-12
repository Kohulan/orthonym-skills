# Build and QA pipeline

Contents: environment, build chain, what to look for, deliverables.

## Environment (once per session, in a scratch folder outside the repo)

```bash
S=<scratch folder>; SK=<folder of Anthropic's pptx skill>
mkdir -p $S/build $S/assets && cd $S/build
npm install pptxgenjs jszip sharp playwright        # pin playwright to the browser build you have cached
python3 -m venv $S/venv && $S/venv/bin/pip install defusedxml lxml pillow qrcode 'markitdown[docx]'
```

`apply_theme.js` needs `NODE_PATH=$S/build/node_modules` to find jszip. The build script reads the
skill folder from `PPTX_SKILL`. Run LibreOffice through the skill's `soffice.py` wrapper; a bare
`soffice` can hang. A project jar may need a newer JDK than the system one; look in `~/.jdks/`.

## Build chain

```bash
PPTX_SKILL=$SK NODE_PATH=$S/build/node_modules node poster.js \
&& $S/venv/bin/python $SK/scripts/office/validate.py X.pptx \
&& python3 $SK/scripts/office/soffice.py --headless --convert-to pdf X.pptx >/dev/null 2>&1 \
&& rm -f slide-*.jpg hi-*.jpg && pdftoppm -jpeg -r 45 X.pdf slide && pdftoppm -jpeg -r 110 X.pdf hi
```

Then crop the 110 dpi render into regions with Pillow (header, left column, right column, bottom)
and look at every crop, not only the overview. The 45 dpi `slide-1.jpg` is the preview deliverable.

## What to look for

- Wrapping: a title spilling into the line below, a stat value on two lines, a table label on two
  rows, a caption pushed under the next element. Shorten the text or widen the box; do not shrink
  fonts below the scale.
- Overlaps: bullets under an image whose height came from the wrong aspect ratio. Compute sizes
  from the file's real pixel dimensions.
- Empty gaps: a half column whose chart is too short for its row. Grow the chart or table.
- Transparent charts on a background image: `chartArea: {fill: {color: "FFFFFF", transparency: 100}}`
  and the same for `plotArea`.
- `breakLine` is ignored inside placeholders; use `\n` in the run text.
- Stacked bar: a series with a value in one category only uses `null` for the others; data labels
  must be `ctr`, `inEnd` or `inBase`.
- Rotated text: shape and text box share the same unrotated box and `rotate: 270`; a negative x in
  the unrotated box is fine.
- `validate.py` must print that all validations passed before the pptx leaves the build folder.

## Deliverables

Copy to `<project>/poster/`: the pptx, the PDF, `*_preview.jpg` (45 dpi render), `poster.js`, `bg.js`,
`shots.js`, `assets/`, and a README from `example/README.md`. The project `poster.js` must run from
`poster/` with the README command: `A()` resolves `assets/` next to the script and the apply_theme
require reads `process.env.PPTX_SKILL`. When the layout changes, move the previous pptx, PDF, preview
and `poster.js` to `poster/backup/` first.
