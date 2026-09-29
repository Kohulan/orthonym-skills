---
name: refusal-census
description: Attributes each abstention or failure in a run to the internal code site that refused it, from per-input refusal logs, and ranks those sites by sole-blocker count (the inputs that only one site blocks) to set the build order. Use when the question is "why did we abstain/fail on these", "which site is blocking the most inputs", or "what should we build to raise coverage" — and before scoping any coverage work. Triggers on a run whose failures all carry one undifferentiated reason code, and on a build order ranked by touched-count instead of measured sole-blocker count. Not for grouping failures by a structural feature of the input (use cluster-failures, which this cross-tabs against).
---

# Census the refusals

**A run record alone cannot tell you why your pipeline abstained or failed.** A common
failure mode: every abstaining row carries the identical triple (e.g. `tier=T5,
source=abstain, reason=UNNAMEABLE`) — one mechanism label, 100% of rows, zero resolution.
You cannot rank build order from that alone, and prioritisation stalls until you can.

The information usually exists — it is just not in the run record. Most rule- or
pipeline-based chemistry tools log a refusal/reject event per internal decision point (a
template that didn't match, a candidate that failed a constraint, a ring system with no
handler, a functional group with no rule, …) even when the summary metric collapses them
all into one bucket. If your project has such logs and a parser for the codes in them,
this skill connects the two. If it doesn't yet, build the parser first — usually a small
regex/groupby over structured log lines, not new instrumentation.

A reference project's own development loop has an equivalent step (its "audit" stage):
distinguishing **candidate-availability failures** (nothing valid was ever generated) from
**candidate-selection failures** (a valid candidate existed but the wrong one, or none,
was picked) — a small dedicated script, not a large system. This generalizes past naming:
any candidate-generate-then-select architecture (retrosynthesis route ranking, conformer
selection, reaction-outcome prediction, docking pose ranking) has the same two failure
modes, and conflating them misdirects the fix.

## The procedure

**1. Capture the log, per row.** Run your pipeline with its logger captured at
WARNING-and-above (or whatever level carries refusal events), one record per input. If a
hung input can hang the whole batch, run in short-lived worker subprocesses with a
per-item timeout so one bad input costs one slot, not the whole run.

**2. Parse to codes** with your refusal-code parser. Two behaviours worth building in
deliberately, seen to matter in practice:
- treat any structured "reason" field as **optional** — real sites often log a bare code
  with no reason attached, or one with a non-numeric suffix. Requiring a well-formed
  reason string silently erases those sites from the census.
- **deduplicate per input.** A code firing five times while the pipeline probes five
  substructures/candidates for one input is still *one* blocker for that input. The
  question is "how many inputs does this site block", not "how often does it fire" —
  un-deduplicated counts mis-rank the build order.

**3. Report two rankings, not one.**

| ranking | meaning |
|---|---|
| **first_refusal_site** | the code that fired *first* for each input — the proximate blocker |
| **touched_sites** | every code that fired for the input — total exposure |

These differ substantially and answer different questions. (Illustrative shape from a
real census: one site was the first-fired blocker on roughly 55% of failing inputs and
touched about 68% of them; a second site touched more inputs overall — about 64% — but
led on far fewer.) Fix the leader ranked by first-refusal count; the touched count tells
you what else will still block those same inputs afterwards, so it sets expectations, not
build order.

**4. Cross-tab against the structural feature clusters** from `cluster-failures` —
scaffold class, charge state, stereocenter count, size band, functional-group class. A
site that blocks one cluster is a different piece of work from a site that blocks all of
them.

**5. Report the mean codes per failing input.** If it's, say, 3–4 (median 4), most
failures are blocked at several sites simultaneously, so fixing the leader alone will not
flip most of them to success. Ranking without this number over-promises the win — say it
up front, before anyone commits to a build order.

## Refusal conditions

Report **UNUSABLE** and stop if:

- fewer than ~90% of failing rows carry ≥1 code — the capture is broken, not the
  pipeline.
- the census was run on a **different corpus, split, or tier** than the one the goal is
  defined over. This is a real trap: a census computed on one dataset/commit/tier does
  not transfer to another — re-measure on the target split before sizing any build
  against it.

## Do not size a build from another corpus's census

Numbers do not transfer between corpora, tiers, or commits. Cite the corpus, the tier (or
mode/config), the commit, and the row count with every figure you report.

## Related

- `check-target` — validate the class before scoping it.
- `spy-site` — prove the site is actually on the execution path before editing it.
- `cluster-failures` — the structural feature clusters to cross-tab against.
- Your project's own fix-methodology / engineering-log doc — verify the capture/harness
  actually ran before trusting any percentage (a silently-broken capture reports a fake
  100% or a fake 0% just as convincingly as a real one).
