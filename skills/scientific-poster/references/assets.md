# Assets

Contents: asset table, sizing rules.

All assets live in `assets/` next to the build script, which references them by file name.

| Asset | How |
|---|---|
| Product wordmark | from the repo (`doc/`, `frontend/public/`); PNG with alpha, 4000 px wide or more |
| Institution logo | SVG from a repo or the website, rasterised with sharp: `sharp(Buffer.from(svg)).resize({width: 2400}).png()`; no rsvg or cairosvg needed |
| Second institution logo | only for a real affiliation; if taken from another PDF (`pdfimages -png`, then recombine image and soft mask with Pillow `putalpha`), say so in the report so an official file can replace it |
| QR codes | `qrcode.make(url, box_size=20, border=2)` in the venv; one for the repository, one for the public instance, one `mailto:` for the corresponding author ("Contact") |
| Screenshots | `example/shots.js`: Playwright against the public instance, viewport 2000 × 1500 at deviceScaleFactor 2, upload a real test file through `input[type=file]`, wait for the result route, screenshot the page; crop with Pillow to the rows that matter and to cut toasts. A handful of uploads, not dozens: a public instance is not a load-test target |
| Background | `example/bg.js`: radial gradients in brand tints plus a faint hexagon motif on the right edge and the corners, 3311 × 4681 px PNG, about 1.8 MB |
| Problem illustration | the script draws a three-box shape diagram unless `assets/problem.png` (3:1) exists; write a prompt file for an image generator with the brand colours and "no text" (`example/illustration-prompt.md`). A delivered JPEG gets its white background removed: alpha from the darkest channel, ramp 200 to 238 |
| Architecture or object-model figure | from the repo docs if one exists; otherwise leave it out rather than invent one |
| "Built on" logos | from the library's own docs; footer only |

## Sizing rules

Sizes in the script are computed from the real pixel dimensions (`w * h_px / w_px`), never guessed.
Keep the pptx under about 10 MB: JPEG for photos and renders, PNG only where alpha is needed.
