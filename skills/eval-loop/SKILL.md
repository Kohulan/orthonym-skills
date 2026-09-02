---
name: eval-loop
description: Use when the user says "improve accuracy", "work the loop", "run the eval loop", "what should we fix next", or wants measurable progress on a chemistry model or pipeline across iterations. Also use when an accuracy push has no stated objective and no bounds, or when an iteration moved the headline number by zero and the next step is unclear.
---

# The evaluation loop

One iteration = one failure cluster. Stop after a small fixed number of iterations (e.g.
3) or when the goal threshold in your goals/bounds file is met, then report.

```
run eval  ->  cluster failures  ->  fix ONE cluster  ->  re-run  ->  check goals  ->  log
```

**Your goals/bounds file must be ENFORCED, not read by eye.** After a re-run, evaluate
the bounded contract with an enforcer script (or, at minimum, a checklist you actually
run through every time) that derives every hard and relaxable bound from the run + gate
artifacts and fails loudly on any hard-bound violation:

```bash
<your-goals-enforcer> --run <runs-directory>/<id>.json --gate <gate-verdict-file>
```

A hard-bound violation (e.g. a wrong-structure/wrong-prediction rate rising, a
protected-set regression, or an exact-match requirement breaking) means **revert, do
not trade**: if a change makes a hard bound worse, undo the change, full stop, no
matter what else it improved elsewhere. Write that rule down once in your own project's
docs (an `eval/LOOP-CONTRACT.md` or equivalent) and read it alongside the goals file, so
a fix that trades away a hard bound for a soft one is never mistaken for progress. The
failure curriculum for the next iteration should be minted from the run or a wider
audit — never by touching your protected splits.

This is a **developer** workflow. Do not implant any part of it into the product/library
itself: no self-correction loop, no retry ladder, no agentic behaviour inside the
inference path just because your dev loop uses one. If your pipeline already calls an
external validator at inference time (e.g. a round-trip parser gate), that is an
existing design decision — this loop is not a licence to add more inference-time
machinery.

## Per iteration

**1. Measure.** Use the `run-eval` skill (or your project's equivalent). Run the
shipped config for the headline number, and an ungated/diagnostic config for a
clusterable run:

```bash
<your-eval-command> --split <dev-split> --tag "iter-N-before"
<your-eval-command> --split <dev-split> --gates off --tag "iter-N-before-diag"
```

**2. Diagnose.** Use the `cluster-failures` skill (or equivalent) on the diagnostic
run. Take the largest cluster — but read its actual examples first. A cluster can look
large because a totally different layer fails on inputs that merely happen to share
one surface feature (same scaffold class, same ring system, same functional group) —
sharing that feature doesn't mean sharing a cause.

Then locate the actual code site by **measurement, not by reading the code and
guessing**. A documented "central decision point" named in a comment, a roadmap, or an
old design doc is not evidence it's on the execution path — repeatedly, in real
projects, a function named as "the place that decides X" turns out to be called zero
times for the cases it was meant to fix, because an earlier stage never produces more
than one candidate for it to choose between. Spy on the site with a counter
(monkeypatch a call counter, add a temporary log line) and validate the spy against
**two or more** known positive cases before trusting a zero-calls reading — a single
positive can itself be misleadingly wrong (e.g. served from a warm cache).

**3. Fix at the root.** Follow your project's fix-methodology doc if you have one (the
governing rule, restated: build the whole class of cases correctly, or fail closed on
the whole class — never a regex post-processor, never a per-case special case, never a
string rewrite bolted onto an already-generated output).

Removing a wrong output is not automatically progress — check what the pipeline
actually emits *afterward*, not just that the bad path stopped firing. A guard that
blocks a fabricated output can unmask a different, equally wrong path underneath it
(seen repeatedly across real projects: a rejected bad prefix silently drops atoms
instead of refusing; an over-broad refusal turns a correct answer into a merely-valid
but non-preferred one; denying one bad case falls through to an even more generic,
wrong default).

**4. Re-measure, cheaply.** If your project has a cheap re-measurement tool — one that
re-runs the pipeline but only re-invokes an expensive external validator for outputs
that actually **changed** since the baseline run — use it:

```bash
<your-cheap-remeasure-command> --baseline <iter-N-before run id>
```

This should print churn in both directions (how many rows got better, how many got
worse), so a "net +0" result that actually moved many rows each way stays visible
instead of looking like nothing happened. Then run the full eval command for the
iteration's headline number.

**5. Gate.** A change must not regress your protected-set metric: run the fast pre-gate
(see the `run-gate` skill) and read the actual pass count against a **current**
baseline — a bare PASS verdict is not sufficient if the baseline it's compared against
is stale.

**6. Log.** Append one row to your project's eval log: iteration number, cluster
worked, run ids before and after, the delta on every tracked bound, the commit, and one
line on what actually changed. Log a negative result too — an iteration that moved
nothing is one of the most useful entries in the log, because it stops the next session
from repeating the same attempt.

## Bounded objectives — maximise ONE, bound the rest

Do not optimise several metrics at once. This is a documented failure mode of
LLM-driven iterative-improvement agents generally: one such agent, per its own
published account, *"struggled to optimise multiple objectives in parallel… would
implement a change but immediately revert it if any metrics regressed, preventing
necessary trade-offs."* The fix that worked was to **bound every metric except one, and
maximise only that one**, relaxing a bound deliberately (and visibly) only when it
truly had to move.

Per iteration, declare one objective and hold every other tracked number as a bound.
Example table (substitute your project's actual metrics — a property predictor might
use MAE-on-holdout as the objective with calibration/coverage as bounds; a
retrosynthesis model might use top-k accuracy as the objective with route-validity as a
bound):

| | metric | role this iteration |
|---|---|---|
| **maximise** | your headline correctness metric | the objective |
| bound | protected-set pass count ≥ current baseline | hard, never relaxed |
| bound | precision/coverage on produced outputs ≥ current | relax only with a stated reason |
| bound | output size/length/complexity ≤ current mean | **a bound, never an objective** |
| bound | runtime/inference cost ≤ current | relax deliberately, and say so |

**A cheap-to-compute proxy like output length must never become an objective.** The
same documented agent adopted mean output length as a quality proxy and drove it down
sharply — the same pressure that shortens names also truncates them into wrong ones
(e.g. `caffein` instead of caffeine, or a truncated systematic name for a simple
structure), and its correctness on a held-out set came out an order of magnitude below
a project that never optimised length. Bound proxies like this to stop degenerate
drift; never reward them directly.

## Plateau trigger — hand it to a fresh agent

On an iteration that moves the objective by zero, do **not** keep iterating in the same
context. The same documented multi-agent protocol handles this: *"When the agent
appeared unable to find further improvements, the reviewer agent was used to analyse
the codebase and create a detailed improvement plan, as a markdown file, which was
given to a fresh implementation agent."*

Concretely: a reviewer role writes a plan file, and a **fresh** implementer executes it
— not the same context that just plateaued. The reviewer role should also hold sole
authority to edit your goals/bounds file and this loop's own rules; an implementer that
can move its own goalposts mid-iteration is not measurable.

A zero-movement iteration on your headline objective is not automatically a failure —
check which bound the work actually targeted. A batch of fixes that holds the headline
metric exactly flat while clearing a different bound (e.g. a spelling/formatting-layer
correctness class that a round-trip-validity check literally cannot see) is real
progress on that bound's axis, not a plateau. Confirm which axis the work was on before
calling anything a plateau.

## Rules that make the loop mean something

- **One cluster per iteration.** Two unrelated fixes in one iteration destroy the
  attribution the next decision depends on.
- **Never touch your held-out split** unless the user asks in so many words. It exists
  to be spent exactly once, at the end.
- **Never re-sample a split.** Split files are the contract; a good harness records
  their content hash and refuses to compare runs across a hash change.
- **Watch coverage and precision together.** A headline correctness metric rising while
  precision-on-produced falls usually means abstention/coverage widened, not that
  outputs got better — especially when the headline metric is reference-free and
  measured identical whether validity gates are on or off, in which case a move that
  only shifts coverage/precision changed honesty, not correctness.
- **You may run alongside other read-only measurement work**, provided you're not
  writing to the same gate/verdict artifact. If concurrent runs contend over a shared
  external resource (a license, a GPU, a validator subprocess), use an explicit
  budgeting mechanism, not `pgrep` (self-matches, can't count available slots).

## Stopping

Stop at a small fixed number of iterations (e.g. 3) or when your headline metric clears
its goal-file threshold. Then report: the trajectory across every tracked bound, which
clusters were worked, which were tried and refuted, and the next-largest remaining
cluster. If several iterations moved nothing, say so plainly — that's a finding about
where the real difficulty is, not a failure to report.
