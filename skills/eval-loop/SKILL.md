---
name: eval-loop
description: Runs a bounded improvement loop on a chemistry model or pipeline (measure, cluster failures, fix one cluster at the root, re-measure, gate, log), maximising one metric while every other stays a bound. Use when the user says "improve accuracy", "work the loop", "run the eval loop", "what should we fix next", or wants measurable progress across iterations. Also use when an accuracy push has no stated objective and no bounds, or when an iteration moved the headline number by zero and the next step is unclear. Not for a single before/after measurement (use run-eval) or a goal judged against a named reference (use gauntlet-loop).
---

# The evaluation loop

One iteration = one failure cluster. Stop after a small fixed number of iterations (e.g.
3) or when the goal threshold in your goals/bounds file is met, then report.

Copy this checklist and track your progress:
- [ ] 1. Measure: shipped and gates-off runs, both run ids noted
- [ ] 2. Diagnose: largest cluster, examples read, site proven by `spy-site`
- [ ] 3. Fix one cluster at the root
- [ ] 4. Re-measure: churn both ways, then the full eval
- [ ] 5. Gate: enforcer and pre-gate pass against a current baseline
- [ ] 6. Log: one row, negative results too; a fresh copy for the next iteration

**Enforce your goals/bounds file mechanically, not by eye.** After a re-run, evaluate
the bounded contract with an enforcer script (or, at minimum, a checklist you actually
run through every time) that derives every hard and relaxable bound from the run + gate
artifacts and fails loudly on any hard-bound violation, naming the bound and both values:

```bash
<your-goals-enforcer> --run <runs-directory>/<id>.json --gate <gate-verdict-file>
```

A hard-bound violation (e.g. a wrong-structure/wrong-prediction rate rising, a
protected-set regression, or an exact-match requirement breaking) means **revert, do
not trade**: if a change makes a hard bound worse, undo the change, full stop, no
matter what else it improved elsewhere. Write that rule down once in your own project's
docs (an `eval/LOOP-CONTRACT.md` or equivalent) and read it alongside the goals/bounds file,
so a fix that trades away a hard bound for a soft one is never mistaken for progress. The
failure curriculum for the next iteration should be minted from the run or a wider
audit — never from the held-out split or the protected set.

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
run. Take the largest cluster, but read its examples first: rows that share a surface
feature need not share a cause (`cluster-failures` explains why).

Then prove the code site runs for the target rows with `spy-site` (or equivalent) before
editing it; a site named in a comment, roadmap, or design doc is often called zero times.
If it records zero calls on the target rows, return to Step 2 with the next site or cluster.

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
is stale. If a hard bound got worse or the gate fails, revert and return to Step 3.

**6. Log.** Append one row to your project's eval log: iteration number, cluster
worked, run ids before and after, the delta on every tracked bound, the commit, and one
line on what actually changed. Log a negative result too — an iteration that moved
nothing is one of the most useful entries in the log, because it stops the next session
from repeating the same attempt.

## Bounded objectives — maximise one, bound the rest

Per iteration, maximise one objective and hold every other tracked number as a bound,
relaxed only deliberately and visibly (`bounded-goals` writes that contract).

Example table (substitute your project's actual metrics — a property predictor might
use MAE-on-holdout as the objective with calibration/coverage as bounds; a
retrosynthesis model might use top-k accuracy as the objective with route-validity as a
bound):

| | metric | role this iteration |
|---|---|---|
| **maximise** | your headline correctness metric | the objective |
| bound | protected-set pass count ≥ current baseline | hard, never relaxed |
| bound | precision-on-emitted and emit rate ≥ current | relax only with a stated reason |
| bound | output size/length/complexity ≤ current mean | **a bound, never an objective** |
| bound | runtime/inference cost ≤ current | relax deliberately, and say so |

**Bound a cheap proxy like output length; never make it an objective.** Length pressure
truncates outputs into wrong ones (`caffein` for caffeine) that still pass a validity check.

## Plateau trigger — hand it to a fresh agent

On an iteration that moves the objective by zero, hand the next step to a fresh context
instead of iterating in the one that plateaued: a reviewer role analyses the code and
writes an improvement plan to a file, and a fresh implementer executes it. The reviewer
role should also hold sole authority to edit your goals/bounds file and this loop's own
rules; an implementer that can move its own goalposts mid-iteration is not measurable.

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
  to be spent exactly once, at the end. Optional guard: the opt-in `guard-holdout` hook
  (`hooks/guard-holdout.py` in this plugin; setup in `hooks/README.md`) stops a held-out run
  until the user has agreed.
- **Never re-sample a split.** Split files are the contract; a good harness records
  their content hash and refuses to compare runs across a hash change.
- **Watch coverage and precision together.** A headline correctness metric rising while
  precision-on-emitted falls usually means abstention/coverage widened, not that
  outputs got better — especially when the headline metric is reference-free and
  measured identical whether validity gates are on or off, in which case a move that
  only shifts coverage/precision changed honesty, not correctness.
- **You may run alongside other read-only measurement work** if nothing writes the same
  gate/verdict artifact; budget shared resources as `run-eval` says.

## Stopping

Stop at a small fixed number of iterations (e.g. 3) or when your headline metric clears
its threshold in the goals/bounds file. Then report: the trajectory across every tracked
bound, which clusters were worked, which were tried and refuted, and the next-largest
remaining cluster. If several iterations moved nothing, say so plainly — that's a finding
about where the real difficulty is, not a failure to report.
