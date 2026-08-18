---
name: run-gate
description: Run your project's regression gate correctly (protected-regression-set + determinism, or whatever your gate checks). Use whenever a change needs gating, before shipping a phase, or when the user says "run the gate". Encodes the full recipe - fast pre-gate, background launch, sentinel watching, reconciliation - so it is not retyped in prompts.
---

# Phase gate recipe

The gate (`<your-gate-command>`, e.g. a script that re-runs your protected regression
set plus a determinism/stability check) is the sole regression detector for a chemistry
tool under active development — property predictor, structure↔name converter, reaction
predictor, docking scorer, whatever you're building. A full run can be slow (minutes to
hours) if it re-validates a large protected set or re-runs anything stochastic enough to
need a determinism check. Never improvise the recipe below.

## Wire this up

Substitute for your project:
- `<your-gate-command>` — the script/command that runs your full gate
- `<fast-gate-flag>` — if you have a cheap pre-check (protected-set only, no determinism/slow checks)
- `<gate-verdict-file>` — the structured output file the gate writes (JSON, not just an exit code)
- `<gate-log-file>` — the log the gate streams to
- "your protected regression set" — whatever must never silently regress: a gold-name set,
  a benchmark of known-correct predictions, a set of molecules with verified properties
- "your primary + secondary checks" — e.g. accuracy-on-protected-set + determinism,
  or accuracy + a fairness/coverage bound, or RMSE-on-holdout + no-NaN-outputs

## Iterating on a fix → fast pre-gate first

```bash
<your-gate-command> <fast-gate-flag>     # protected-set check only, minutes
```
Catches regressions on your protected set before you pay for the full gate. The fast
gate is NEVER sufficient to ship — it skips whatever the full gate additionally checks
(determinism, a slower held-out pass, a secondary bound).

## Shipping a phase → full gate

1. Commit the work first (explicit paths). Never run a git-mutating agent alongside a
   gate. Other read-only or independent work MAY run concurrently — a probe, a single
   prediction, or an eval on a different split is fine, provided your gate reserves
   whatever shared resource it needs (a license, a GPU, an interpreter/worker slot)
   through an explicit budget mechanism rather than assuming exclusivity. What must NOT
   run concurrently is a **second gate against the same verdict file** — two gates each
   writing `<gate-verdict-file>` / `<gate-log-file>` clobber each other's result. If
   your gate doesn't already lock its own output artifacts, add that lock before
   trusting concurrent runs.
2. Launch **in the background**, never under a hard `timeout N` — a timeout sized for
   the common case will kill a slow determinism/stability pass mid-run:
   ```bash
   <your-gate-command>          # logs stream to <gate-log-file> (line-buffered)
   ```
3. **Wait on the sentinel file, never `pgrep`, never a sleep-loop.** Have the gate
   delete `<gate-verdict-file>` at start and write it only on completion, then either:
   - take the background-task-completion notification your harness gives you, or
   - poll with a proper wait primitive on `test -f <gate-verdict-file>`.
   No watchdog subagents — the sentinel file makes them unnecessary, and `pgrep`
   self-matches and can't tell you how many are running or whether the one you care
   about finished.
4. **Reconcile the structured verdict, never the exit code alone.** `cat
   <gate-verdict-file>` and check its fields explicitly, e.g.:
   - "new regressions on the protected set" must be 0 (a hard stop),
   - your primary metric's pass count must be **≥ a real, current baseline** — not a
     stale one. A gate that compares against last month's baseline can report PASS
     while a real regression slipped through (e.g. baseline says 1630, actual is 1641,
     and a true 1641→1640 drop still reads PASS). Re-baseline **up** after every ship.
   - determinism/stability check (if you have one) must show 0 new nondeterminism.
   A bare `exit 0` / `"verdict": "PASS"` is not sufficient on its own — read the
   fields that verdict is built from.
5. **On FAIL, read `<gate-log-file>` for the specific regression lines** (whatever your
   gate logs them as — "NEW REGRESSION:", a diff of protected-set predictions before/
   after, a new-nondeterminism marker). Fix at the root cause, never patch the
   regressed case only, and re-gate — fast pre-gate first, then full gate again.
6. **The gate does not replace unit tests.** Pair every gated change with a
   touched-module unit test run (HEAD-before vs HEAD-after on just the changed files,
   if your project has that tooling; otherwise a plain targeted `pytest`/test-runner
   invocation on the touched tests).
7. When your protected-set baseline intentionally increases (you fixed real cases, or
   added new ones), update the baseline file in the **same commit** as the fix that
   earned it, and say so in the commit message — otherwise the next gate run can't
   tell an intentional improvement from drift.
