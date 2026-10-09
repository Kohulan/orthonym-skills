---
name: scientific-poster
description: Makes a scientific conference poster (A0 or A1, editable pptx plus print PDF) from a manuscript, a codebase or both, and runs the review on a pin board where the user marks the render and sends each round back. Every number comes from a source, one decision question covers format, size and emphasis, the build is a pptxgenjs script in a fixed layout, validated and rendered before anyone sees it. Use when the user wants a poster for a conference, a meeting or a lab wall, or wants to revise one made this way ("make a poster", "A0 poster from the paper", "update the poster, I marked the changes"). Not for slide decks, single figures, papers or flyers.
---

# Scientific poster

Output: a single-slide `.pptx`, a print PDF, a preview JPEG, the build script and its assets in
`poster/` of the project, and a pin board for review rounds. Everything is rebuilt from `poster.js`;
the pptx is never hand-edited. The worked example in `example/` is a real cheminformatics poster;
`example/reference-render.jpg` shows the finished layout.

Needs: Node (pptxgenjs, jszip, sharp, playwright), LibreOffice, poppler (`pdftoppm`), Python 3 with
Pillow, and Anthropic's `pptx` skill (github.com/anthropics/skills) for `validate.py`, `soffice.py`
and `apply_theme.js`; export its folder as `PPTX_SKILL`. The pin board needs the claude.ai Artifact
tool with the `db` and `comments` capabilities; without it, run the review on the preview image in
chat.

Copy this checklist and track your progress:
- [ ] 1 Sources read, every number noted with where it comes from
- [ ] 2 Decision question answered (or defaults stated)
- [ ] 3 Assets collected, each with its provenance
- [ ] 4 Build validated, render looked at region by region, no wrap or overlap
- [ ] 5 Delivered into `poster/` with README
- [ ] 6 Pin board published; rounds applied until no pin is open

## 1. Gather

- Read the manuscript (`markitdown` with the docx extra), the repos (README, release version, docs,
  test data) and any benchmark report. Note every number with its source. The poster shows only
  numbers a source states; a number you computed yourself is labelled as such.
- Extract: title, authors with affiliations and corresponding e-mail, abstract, the method or
  pipeline steps, 2–4 headline numbers for stat tiles, one or two charts, one table, availability
  (repo, licence, registry coordinates, DOIs, public instance), funding and acknowledgements, 5–7
  references, future work in one line.
- Stale or contradictory facts (README badge vs. build file, paper vs. repo requirement) are findings
  for the report; the poster omits the disputed detail rather than picking a side.

## 2. One decision question

Ask once, with the question picker, offering defaults: format (pptx), size and orientation (A0
portrait, 33.11 × 46.81 in), emphasis (whole pipeline, mirrors the manuscript; or results; or the
tool). Skip what the request already says. Conference name and date go on the poster only when
stated; otherwise leave them out and list it as an open item. Everything else is a routine choice.

## 3. Assets (`references/assets.md`)

Logos from the repos, institution logos, QR codes (repository, web app, a `mailto:` contact),
UI screenshots taken through the real app with Playwright (`example/shots.js`), the gradient plus
hexagon background from `example/bg.js`, and one illustration for the problem statement: a shape
diagram drawn by the script as the fallback, plus a prompt file for an image generator
(`example/illustration-prompt.md`). If the user supplies the image, make its white background
transparent and prefer the PNG.

## 4. Build (`references/layout.md`, `references/build-qa.md`)

Copy `example/poster.js` to the build folder, keep the geometry constants and helpers, replace the
content. The layout: wordmark header with institution logo; full-width abstract band with a vertical
tab and QR codes; a two-column body in open sections separated by thin rules (left: how it works,
with the illustration and a step flow; right: results with stat tiles, a chart, a table and one
italic takeaway line per half); a third row (principles or features left, screenshots right); a footer
with licence line, references in two columns, funding and a contact QR. Section titles 40 pt, body
22–25 pt, nothing under 15 pt on A0.

Build, validate, render to PDF and JPEG, and look at the full page and at zoom crops of every
region. Fix wraps, overlaps, clipped text and empty gaps in the script, never in the pptx. Rebuild
and look again; two or three rounds are normal. `validate.py` must pass before the file leaves the
build folder.

## 5. Deliver

Copy the pptx, the PDF, the preview, `poster.js`, `bg.js`, `shots.js`, `assets/` and a README from
`example/README.md` (rebuild command, asset provenance, number sources) into `<project>/poster/`.
When the layout changes, move the previous outputs to `poster/backup/` first. Record the decisions
and the build location in project memory.

## 6. Review rounds (`references/review-board.md`)

Publish `assets/board.html` with the 110 dpi render as `board.jpg`. The user drops numbered pins
with notes and presses "Done, send to Claude", or says the pins are there. Read the pins back, map
percent positions to slide inches with the geometry constants in `poster.js`, apply, rebuild, republish
the board image to the same URL, mark the pins done. A pin that needs the user's decision stays open
with a question. Repeat until no pin is open.

## Report

Short status: what was built and where, what was verified (validation, render looked at), and open
items as a numbered list: conference name, disputed facts, assets taken from other sources that an
official file should replace.

## Things that bite

- `pres.layout` must be set after `defineLayout`, or the file reports an unknown layout.
- `breakLine` is ignored inside placeholders; use `\n` in the run text.
- A stacked bar series present in one category only needs `null` in the others, and its data labels
  must be `ctr`, `inEnd` or `inBase`.
- Charts over a background image need `chartArea.fill` and `plotArea.fill` at 100 % transparency.
- LibreOffice substitutes fonts it lacks; keep Calibri or Arial so the render predicts PowerPoint.
- A public web instance is not a load-test target: a handful of screenshot uploads, not dozens.
