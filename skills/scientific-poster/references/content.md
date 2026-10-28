# Content rules

Contents: what every number needs, the worked example, wording, references, redesigns,
self-measured results.

These rules come from review rounds on real posters: each one answers a question a reader or a
co-author asked of a finished poster.

## What every number needs

- **Its denominator, on the poster.** A percentage says what it is a percentage of: "% of 3,311
  approved drugs", not "share of drugs". When rows can overlap (one item in several categories),
  say "rows overlap" in the same line, or readers add them up.
- **The selection rule for the data set, with its source.** Name the database and release, the
  filter and the count: "database X release N, filter F, n = 1,234". A reader who cannot see how
  the set was chosen asks "how was this selected?" before anything else.
- **Where it was measured.** Code version or commit, library versions, hardware for timings; in
  the licence line or a caption, at the floor size.
- **A trail in the README.** For each number: the file and line, or the script, that produces it.
  When a user asks "where does this percentage come from?", the answer is a path and a short
  calculation, not a re-derivation.

## The worked example

One real input that goes through the tool, shown at each step with its result, works better than
a feature list. Show the full input (for a molecule, the complete SMILES, not only a drawing), and
explain anything that looks odd in it before a reader asks: a second fragment that is a counter-ion,
a duplicate that is intended, a value that is low for a known reason.

## Wording

- Before a claim calls something a problem, ask whether an expert in the field would disagree. A
  salt is the correct record of a marketed drug; "flagged" or "needs a curation decision" is right,
  "error" is not. Co-authors catch these; catch them first.
- Takeaway lines carry the argument, bullets carry the facts, one message per region.
- A tool command (`docker compose up`) is not content for a poster reader; give the URL of the
  running service and of the docs instead.
- Name related or competing tools in one line when they exist; readers ask.

## References

At most 7 on the poster, in short form ("Author AB et al. Journal Year;Vol:Page"), at the floor
size; the full list goes into the README. Tools that need no citation are named without a number.

## Redesigns and "styles"

- A redesign keeps every content item. "Make it more infographic" or "too full" means less text per
  item and more visual encoding (bars, waffles, tiles, icons), never fewer items. Before showing a
  draft, list the items of the previous version and tick each one off in the new one.
- "Different styles" means different layouts: a different reading order, grouping and visual
  device (a spine of steps, a tile grid, a large annotated screenshot). A new colour scheme on the
  same layout is not a different style.
- When a user rejects the layout itself ("you keep copying the example"), offer two or three
  layouts as low-detail sketches that carry all items, and build only the one picked.
- Web-app screenshots earn space: a reader judges the tool by them. Give them at least a quarter of
  the poster width each, and accept that the UI text inside a screenshot will not meet the floor.

## Self-measured results

When the poster reports a run made for it (no paper or benchmark exists yet):

- Keep the runner, the raw per-item output and the summary script in `poster/audit/`; the build
  reads the summary JSON, never numbers typed into the script.
- Record the code commit, library versions, data release, hardware and date in the README and in
  the licence line.
- Before delivery, a second agent recomputes every poster number from the raw output with its own
  code and reports pass or fail per number.
- When the code changes before the conference, run the audit again on the new commit and compare
  every number; report the ones that moved and why (code or environment). Timings move with
  machine load; say so instead of replacing them silently.
