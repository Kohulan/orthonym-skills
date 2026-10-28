# Build and QA pipeline

Contents: environment, build chain, what to look for, deliverables.

## Environment (once per session, in a scratch folder outside the repo)

```bash
S=<scratch folder>; SK=<folder of Anthropic's pptx skill>; PS=<folder of this skill>
mkdir -p $S/build $S/assets && cd $S/build
npm install pptxgenjs sharp playwright              # pin playwright to the browser build you have cached
python3 -m venv $S/venv && $S/venv/bin/pip install defusedxml lxml pillow qrcode 'markitdown[docx]'
```

Copy `example/theme.js` next to `poster.js`; it loads the jszip that ships with pptxgenjs. The
Python steps read the skill folder from `$SK`. Run LibreOffice through the skill's `soffice.py` wrapper; a bare
`soffice` can hang. A project jar may need a newer JDK than the system one; look in `~/.jdks/`.

## Build chain

```bash
node poster.js \
&& $S/venv/bin/python $SK/scripts/office/validate.py X.pptx \
&& $S/venv/bin/python $PS/scripts/fontcheck.py X.pptx \
&& python3 $SK/scripts/office/soffice.py --headless --convert-to pdf X.pptx >/dev/null 2>&1 \
&& rm -f slide-*.jpg hi-*.jpg && pdftoppm -jpeg -r 45 X.pdf slide && pdftoppm -jpeg -r 110 X.pdf hi
```

Then crop the 110 dpi render into regions with Pillow (header, left column, right column, bottom)
and look at every crop, not only the overview. The 45 dpi `slide-1.jpg` is the preview deliverable.

## What to look for

- Wrapping: a title spilling into the line below, a stat value on two lines, a table label on two
  rows, a caption pushed under the next element. Shorten the text or widen the box; do not shrink
  fonts below the scale.
- Small text: `fontcheck.py` lists every run, table cell and chart element under the floor (7 pt
  on an A4 print, 28 pt on A0) with its shape name, and every chart element with no size. Raise
  the size and shorten the text; it must report 0 and 0.
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
- A brand font the render machine lacks: LibreOffice falls back to a font with other widths, so
  the render wraps where PowerPoint does not. Alias it to a close match for the render only, in
  `~/.config/fontconfig/conf.d/60-<font>-alias.conf`:
  `<fontconfig><alias><family>Brand Font</family><prefer><family>Close Match</family></prefer></alias></fontconfig>`,
  then `fc-cache -f`; say in the README that the render uses the alias.
- `validate.py` must print that all validations passed, and `fontcheck.py` must exit 0, before the
  pptx leaves the build folder.

## Deliverables

Copy to `<project>/poster/`: the pptx, the PDF, `*_preview.jpg` (45 dpi render), `poster.js`,
`theme.js`, `bg.js`,
`shots.js`, `assets/`, and a README from `example/README.md`. The project `poster.js` must run from
`poster/` with the README command: `A()` and `bg.js` resolve `assets/` next to the script, and
`theme.js` sits beside `poster.js`. When the layout changes, move the previous pptx, PDF, preview
and `poster.js` to `poster/backup/` first.
