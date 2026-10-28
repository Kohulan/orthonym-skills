---
name: scientific-poster
description: Makes a scientific conference poster (A0 or A1 portrait, editable pptx plus print PDF) from a manuscript, a codebase or both, and runs the review on a pin board where the user marks the render and sends each round back. Every number comes from a source, one decision question covers format, size and emphasis, the build is a pptxgenjs script in a fixed layout, validated, font-checked so an A4 print stays readable, and rendered before anyone sees it. Use when the user wants a poster for a conference, a meeting or a lab wall (also from a README or a benchmark table, in any size or orientation), or wants to revise one made this way ("make a poster", "A0 poster from the paper", "update the poster, I marked the changes", "the pins are on the board, apply them", "I edited the pptx, change this line"). Not for slide decks, single figures, papers or flyers.
---

# Scientific poster

Output: a single-slide `.pptx`, a print PDF, a preview JPEG, the build script and its assets in
`poster/` of the project, and a pin board for review rounds. Everything is rebuilt from `poster.js`
until the user edits the pptx by hand; from then on, see "Hand edits". The worked example in
`example/` is a real cheminformatics poster; `example/reference-render.jpg` shows the finished layout.

Needs: Node (pptxgenjs, sharp, playwright), LibreOffice, poppler (`pdftoppm`), Python 3 with
Pillow, and Anthropic's `pptx` skill (github.com/anthropics/skills) for `validate.py` and
`soffice.py`; export its folder as `PPTX_SKILL`. The pin board needs the claude.ai Artifact
tool with the `db` and `comments` capabilities; without it, run the review on the preview image in
chat.

Copy this checklist and track your progress:
- [ ] 1 Sources read, every number noted with where it comes from and what it is a share of
- [ ] 2 Decision question answered (or defaults stated)
- [ ] 3 Assets collected, each with its provenance
- [ ] 4 Build validated, `fontcheck.py` passed, render looked at region by region, no wrap or overlap
- [ ] 5 Delivered into `poster/` with README
- [ ] 6 Pin board published; rounds applied until no pin is open

## 1. Gather

- Read the manuscript (`markitdown` with the docx extra), the repos (README, release version, docs,
  test data) and any benchmark report. Note every number with its source. The poster shows only
  numbers a source states; a number you computed yourself is labelled as such.
- Extract: title, authors with affiliations and corresponding e-mail, abstract, the method or
  pipeline steps, 2–4 headline numbers for stat tiles, one or two charts, one table, availability
  (repo, licence, registry coordinates, DOIs, public instance), funding and acknowledgements, 5–7
  references, future work in one line, and one real input to follow through the tool.
- For each number, note its denominator and, for a data set, the selection rule and its source;
  both go on the poster (`references/content.md`). When no benchmark exists and the user wants
  results, run one; `references/content.md` says how to keep it reproducible and checked.
- Stale or contradictory facts (README badge vs. build file, paper vs. repo requirement) are findings
  for the report; the poster omits the disputed detail rather than picking a side.

## 2. One decision question

Ask once, in the first reply (also when the user asked only for a plan), with the question picker,
at most three items, each with a default: format (pptx), size
(A0, 33.11 × 46.81 in, or A1), emphasis (whole pipeline, mirrors the manuscript; or results; or the
tool). Skip what the request already says. Do not ask about anything else. Logos, URLs, funding, the illustration and the
conference come from the sources; what is missing goes under "Open items" as a statement with its
default ("Logos: taken from the repo; an official file can replace them later"), never as a question.

The layout is portrait only, and there is no landscape variant to build. When the request asks for
landscape, say so in the same question and offer portrait at the stated size; do not offer or
recommend a custom landscape layout. Conference name and date go on the poster only when stated.

## 3. Assets (`references/assets.md`)

Logos from the repos, logos of the institutions the sources name (never one from the example or
from memory), QR codes (repository, web app, a `mailto:` contact),
UI screenshots taken through the real app with Playwright (`example/shots.js`), the gradient plus
hexagon background from `example/bg.js`, and one illustration for the problem statement: a shape
diagram drawn by the script as the fallback, plus a prompt file for an image generator
(`example/illustration-prompt.md`). If the user supplies the image, make its white background
transparent and prefer the PNG.

## 4. Build (`references/layout.md`, `references/build-qa.md`, `references/content.md`)

Copy `example/poster.js` to the build folder, keep the geometry constants and helpers, replace the
content. The layout: wordmark header with institution logo; full-width abstract band with a vertical
tab and QR codes; a two-column body in open sections separated by thin rules (left: how it works,
with the illustration and a step flow; right: results with stat rows, a chart, a table and one
italic takeaway line per half); a third row (principles or features left, screenshots right); a footer
with licence line, short references in two columns, funding and a contact QR.

Readability: nothing under 7 pt when the whole poster is printed on A4 and held at arm's length,
which is 28 pt on A0 and 20 pt on A1; section titles 48 pt, body 30 pt on A0. Text that does not
fit is shortened, never set smaller. `scripts/fontcheck.py <file.pptx>` checks every text run,
table cell and chart label against that floor and exits 1 on a failure.

Build, validate, run `fontcheck.py`, render to PDF and JPEG, and look at the full page and at zoom
crops of every region. Fix wraps, overlaps, clipped text and empty gaps in the script, never in the
pptx. Rebuild and look again; two or three rounds are normal. `validate.py` and `fontcheck.py` must
pass before the file leaves the build folder.

A request for a new look ("more infographic", "too full", "other styles") keeps every content item
and changes the layout, not only the colours. First list every item of the current poster from
`poster.js`; remove only what the user named, and tick each other item off in the new version.
`references/content.md` has the rules.

## 5. Deliver

Copy the pptx, the PDF, the preview, `poster.js`, `theme.js`, `bg.js`, `shots.js`, `assets/` and a README from
`example/README.md` (rebuild command, asset provenance, number sources with the full reference list) into `<project>/poster/`.
When the layout changes, move the previous outputs to `poster/backup/` first. Record the decisions
and the build location in project memory.

## 6. Review rounds (`references/review-board.md`)

Publish `assets/board.html` with the 110 dpi render as `board.jpg`. The user drops numbered pins
with notes and presses "Done, send to Claude", or says the pins are there. Read the pins from the
board's database (`ArtifactData` query on the `pins` collection), never from a screenshot or the
comment text alone; map percent positions to slide inches with the geometry constants in `poster.js`, apply, rebuild, republish
the board image to the same URL, mark the pins done. A pin that needs the user's decision stays open
with a question. Repeat until no pin is open.

## Hand edits

This mode starts only when the user says they edited the pptx, or the pptx is newer than the PDF and
preview of the last build; otherwise every change goes into `poster.js` and the poster is rebuilt.
Once the user has edited the pptx in PowerPoint, a rebuild from `poster.js` would erase their
changes. From then on:

1. Copy their file to `poster/backup/` before any change (`scripts/patch_text.py` does this).
2. Text changes: `scripts/patch_text.py <file.pptx> "<old>" "<new>"` replaces one text run in the
   slide XML and keeps its formatting. Anything else (moving or resizing shapes, chart text): make it
   in the XML the same way, or tell the user what to change in PowerPoint.
3. Copy the same change into `poster.js`, so a later rebuild does not undo it.
4. Run `validate.py` and `fontcheck.py` on their file, render it and look at the changed region.
   Text under the floor that their own edits introduced is reported, not changed.

If the user renames or moves the file, use the new name and do not restore the old one.

## Report

Short status: what was built and where, what was verified (validation, font check, render looked
at), and open items as a numbered list: conference name, disputed facts, assets taken from other
sources that an official file should replace.

## Things that bite

- `pres.layout` must be set after `defineLayout`, or the file reports an unknown layout.
- pptxgenjs always writes Office's colour scheme. `example/theme.js` writes the poster palette into
  the theme after `writeFile`; without it every `pres.SchemeColor` shape renders Office blue.
- LibreOffice substitutes fonts it lacks; keep Calibri or Arial so the render predicts PowerPoint,
  or alias a brand font the render machine lacks (`references/build-qa.md`).
- Chart text left at its default size renders at 10–18 pt; set every chart font size.
- Chart and placeholder pitfalls (`breakLine`, stacked bars, transparent charts) are in
  `references/build-qa.md`.
