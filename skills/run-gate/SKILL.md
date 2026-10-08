---
name: run-gate
description: Runs a project's regression gate (a protected regression set plus a determinism check, or whatever the gate checks) by its full recipe — fast pre-gate while iterating, background launch, waiting on a sentinel verdict file, and reconciling the verdict's fields against a current baseline. Use when a change needs gating, before shipping a phase, or when the user says "run the gate". Not for measuring accuracy on an eval split (use run-eval) or for keeping watch over some other long job (use watching-background-jobs).
---

# Phase gate recipe

The gate (`<your-gate-command>`, e.g. a script that re-runs your protected regression
set plus a determinism/stability check) is the sole regression detector for a chemistry
tool under active development. A full run can take hours. Follow the recipe below as
written; each step closes a known way for a gate run to mislead.

## Wire this up

Substitute for your project:
- `<your-gate-command>` — the script/command that runs your full gate
- `<fast-gate-flag>` — if you have a fast pre-gate (protected-set only, no determinism/slow checks)
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
pre-gate is never sufficient to ship — it skips whatever the full gate additionally checks
(determinism, a slower held-out pass, a secondary bound).

## Shipping a phase → full gate

Copy this checklist and track your progress:
```
- [ ] 1 Work committed by explicit paths; no other gate on this verdict file
- [ ] 2 Old verdict file removed; gate launched in the background, no `timeout`
- [ ] 3 Verdict file appeared
- [ ] 4 Fields reconciled: fresh verdict, 0 new regressions, pass count ≥ current baseline
- [ ] 5 On FAIL: regression lines read, root cause fixed, back to the fast pre-gate
- [ ] 6 Touched-module unit tests run
- [ ] 7 Baseline bumped in the same commit, if it rose
```

1. Commit the work first (explicit paths), so the verdict belongs to one commit. Keep
   git-mutating agents out of the tree while a gate runs, because they change what it
   measures; read-only work may run alongside. What must not run concurrently is a
   **second gate against the same verdict file** — two gates each writing
   `<gate-verdict-file>` / `<gate-log-file>` clobber each other's result. If your gate
   doesn't already lock its own output artifacts, add that lock (`<gate-verdict-file>.lock`
   holding the gate's PID) before trusting concurrent runs.
2. Launch **in the background**, never under a hard `timeout N` — a timeout sized for
   the common case will kill a slow determinism/stability pass mid-run. Remove the last
   verdict first, so only this run can satisfy step 3:
   ```bash
   rm -f <gate-verdict-file>; <your-gate-command>   # logs stream to <gate-log-file> (line-buffered)
   ```
   Optional guard: the opt-in `gate-guard` hook (`hooks/gate-guard.py` in this plugin; setup
   in `hooks/README.md`) stops a gate run under `timeout` or while another gate holds the
   verdict lock.
3. **Wait on `<gate-verdict-file>` (the sentinel), never on `pgrep` or a foreground
   sleep-loop.** The gate writes it only on completion; then either:
   - take the background-task-completion notification your harness gives you, or
   - run `until test -f <gate-verdict-file>; do sleep 30; done` as a background command
     (the Bash tool's `run_in_background`), which notifies you once when it exits.
   No watchdog subagents — the sentinel file makes them unnecessary, and `pgrep`
   self-matches and can't tell you how many are running or whether the one you care
   about finished. For progress lines and stall detection while it runs, follow
   `watching-background-jobs`.
4. **Reconcile the structured verdict, never the exit code alone.** `cat
   <gate-verdict-file>` and check its fields explicitly, e.g.:
   - the file is newer than your launch, and, if your verdict records a commit, it equals
     `git rev-parse HEAD` (a leftover verdict reads PASS for code it never saw),
   - "new regressions on the protected set" must be 0 (a hard stop),
   - your primary metric's pass count must be **≥ a real, current baseline** — not a
     stale one. A gate that compares against last month's baseline can report PASS
     while a real regression slipped through (e.g. baseline says 1630, actual is 1641,
     and a true 1641→1640 drop still reads PASS). Re-baseline up after every ship.
   - determinism/stability check (if you have one) must show 0 new nondeterminism.
   A bare `exit 0` / `"verdict": "PASS"` is not sufficient on its own — read the
   fields that verdict is built from. If any field fails, go to Step 5.
5. **On FAIL, read `<gate-log-file>` for the specific regression lines** (whatever your
   gate logs them as — "NEW REGRESSION:", a diff of protected-set predictions before/
   after, a new-nondeterminism marker). Fix at the root cause, never patch the
   regressed case only, and re-gate — fast pre-gate first, then full gate again.
6. **The gate does not replace unit tests.** Pair every gated change with a
   touched-module unit test run (HEAD-before vs HEAD-after on the changed files if your
   project has that tooling, else a targeted `pytest`/test-runner run of the touched tests).
7. When your protected-set baseline intentionally increases (you fixed real cases, or
   added new ones), update the baseline file in the same commit as the fix that
   earned it, and say so in the commit message — otherwise the next gate run can't
   tell an intentional improvement from drift.
