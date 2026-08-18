# Skills catalog

One section per skill: what it does, when it fires, and — for the workflow skills — exactly what to
wire up before it works in your project. Two groups: **Process skills** (ready to use, no setup) and
**Workflow skills** (encode a measurement loop; substitute your project's commands once).

---

## Process skills (ready to use)

### `gauntlet-loop`
Turns any goal into one paste-ready "gauntlet loop" prompt: the agent sets a concrete quality bar,
splits the work into small judgeable pieces, runs a *builder* and a separate *harsh critic* on each,
compares blind against the bar, and loops until it wins. Works for builds, writing, code, research,
design. **Triggers:** "/gauntlet-loop", "gauntlet this", "loop until it beats X". **Wire up:** nothing.

### `council`
A 3-voice, search-first process for strategy / prioritization / judgment-call questions ("which
option", "what next", "is X worth it", "your call"). Forces a recorded recommendation with an explicit
flip-condition instead of an off-the-cuff answer. **Wire up:** nothing (the "search first" step just
means look up prior context — notes, docs, logs — before opining).

### `fable-review`
Get an adversarial second opinion on a plan / finding / diagnosis from a *different* model before you
ship it. Targets the dominant failure mode of confident autonomous work — a plausible-but-wrong
premise. **Triggers:** before committing a load-bearing plan; "fable-review". **Wire up:** point it at
whatever second model you have access to.

### `spy-site`
Prove a code site is *actually on the execution path* before you edit it. Refuses the site if it
records zero calls for the target inputs. Kills the recurring "I fixed the central decision point"
that turns out never to run. **Triggers:** before any fix that names a function/module as "the place to
change". **Wire up:** nothing — the method (instrument, run a known-positive, count calls) is
language-agnostic.

### `check-target`
Validate a proposed fix target is a real, *single* defect class before any code is written. Refuses
the target if its signature also matches inputs that already succeed (a "lead", not a defect).
**Triggers:** before proposing/starting a fix; whenever a cluster/tell/signature is named as "the thing
to fix". **Wire up:** nothing; pairs with `cluster-failures` and `spy-site`.

---

## Workflow skills (wire in your project's commands)

Each encodes a measurement discipline that transfers directly; you substitute your project's plumbing.

### `run-gate`
Run a regression gate correctly: fast pre-gate → background launch (never a hard `timeout`) → wait on
a **verdict file**, not a `pgrep`/sleep-loop → reconcile the **structured verdict**, never just the
exit code → on FAIL read the log for the specific regression lines → re-gate. **Wire up:** your gate
command, its fast-check flag, and its verdict/log file paths. The reusable lessons: read the verdict
not the exit code; a stale baseline can make a PASS hide a regression; never run two gates that clobber
the same verdict file.

### `run-eval`
Measure accuracy on a **fixed, hashed split**, reading several numbers — a headline correctness metric
*plus* emit/coverage and precision — so you can distinguish "fixed a wrong output" from "stopped
emitting one". Never quote proxy metrics (BLEU / token-accuracy / edit-similarity) as a result; keep a
held-out split you never optimise against; record provenance (commit, dirty flag, split hash, config)
with every run. **Wire up:** your eval command, your split names, your metric. Round-trip validation
via RDKit→InChIKey is given as the chemistry-general reference-free check.

### `eval-loop`
The repeatable loop: measure → diagnose ONE failure class → fix at the root (fail-closed) → re-measure
cheaply → gate → log. Includes **bounded objectives** (maximise one metric, hold the rest as explicit
bounds; never let a proxy like output-length become an objective) and a **plateau trigger** (hand a
zero-movement iteration to a fresh agent). **Wire up:** your goals/bounds file and the gate + eval
commands from the two skills above. The multi-objective-thrashing and name-length-as-proxy lessons are
general ML-eval lessons (learned from published post-mortems).

### `cluster-failures`
Group an eval run's failures by a **structural feature of the input molecule** (scaffold class, ring
system, charge, stereocenter count, heavy-atom count, functional-group class…) to decide what to fix
next — **analysis only**, with a hard rule that findings become general fixes, never per-molecule
special-casing or string post-processing on the output. Cluster the *diagnostic* run so the cause is
visible; a big cluster is a lead, not a sized fix. **Wire up:** your cluster tool + the feature axis
that partitions your failures.

### `refusal-census`
Attribute abstentions/failures to the **specific code site** that produced them, so build order is
ranked by measured blocking rather than guesswork. Rank by **sole-blocker** count (what a site is the
*only* blocker for), never by how many items a site merely touches — touched-counts over-count and
aren't additive. **Wire up:** however your pipeline records refusals (failure codes in logs) + a parser
for them.

### `kickoff`
Start/resume a work session by self-priming from durable state (a handoff note + your notes/memory +
`git log`) instead of a hand-written prompt, with an upfront drift-check that the planned next task
matches the roadmap. **Wire up:** your handoff-note path, your notes/memory location, and (optional)
your roadmap for the drift-check.

### `handoff`
End-of-session handoff — verify durable memory is written and produce a next-session resume note so the
next session needs no hand-written prompt. Includes the "never trim your memory file to hit a byte
target" lesson. **Wire up:** your memory-verification step and next-session-note path.

---

## Reference docs (`reference-docs/`, not invocable)

Domain knowledge Claude reads on request (point it at the file). `rdkit-perception`, `fix-methodology`,
`testing-commands` are chemistry-general. The [`examples-iupac-naming/`](../reference-docs/examples-iupac-naming/)
pack is a worked example of a *domain-specific* knowledge file (IUPAC nomenclature) — a template for
building your own sub-domain reference, not something you need unless you work on naming.
