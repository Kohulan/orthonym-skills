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
A search-first process with three or more expert voices for strategy / prioritization / judgment-call
questions ("which option", "what next", "is X worth it", "your call"). Forces a recorded recommendation
with an explicit flip-condition instead of an off-the-cuff answer. **Wire up:** nothing (the "search
first" step just means look up prior context — notes, docs, logs — before opining).

### `fable-review`
Get an adversarial second opinion on a plan / finding / diagnosis from a *different* model family
before you ship it. The reviewer reports every gap it finds with a severity tag; you do the filtering.
Targets the dominant failure mode of confident autonomous work — a plausible-but-wrong premise.
**Triggers:** before committing a load-bearing plan; "fable-review". **Wire up:** nothing in Claude
Code, where it asks for the `fable` model alias (`opus` when the session already runs on Fable). In
another harness, point it at whatever second model you have access to.

### `spy-site`
Prove a code site is *actually on the execution path* before you edit it. Refuses the site if it
records zero calls for the target inputs. Kills the recurring "I fixed the central decision point" that
turns out never to run. **Triggers:** before any fix that names a function/module as "the place to
change". **Wire up:** nothing — the method (instrument, run two or more known positives, count calls)
is language-agnostic.

### `check-target`
Validate a proposed fix target is a real, *single* defect class before any code is written. Refuses
the target if its signature also matches inputs that already succeed (a "lead", not a defect).
**Triggers:** before proposing/starting a fix; whenever a cluster/tell/signature is named as "the thing
to fix". **Wire up:** nothing; pairs with `cluster-failures` and `spy-site`.

### `understand-before-merge`
Make model-written code reviewable instead of skimmable. Delivers three parts in a fixed order: the code
with a short "why" on each non-obvious decision, an explicit **failure-mode table** (malformed input, slow
or dropped dependency, partial completion, concurrency, scale, auth, time, blast radius) that describes
actual behaviour and marks the rows to trace by hand, and 3–7 **open questions** only the human can answer
— left unanswered so the review gate stays human. Scales down for trivial helpers and skips explicitly
throwaway code out loud. **Triggers:** any code the user intends to ship, merge, or run against real data —
bug fixes, endpoints, pipelines, migrations, jobs — even "write me a function". **Wire up:** nothing.

### `enumerate-first`
Before you argue that a case is unreachable, rare, or not worth fixing — or before you tune any
decision point — enumerate it: run the inputs and count how often the branch executes. "Probably
unreachable" is a hypothesis; the count is the answer. **Triggers:** "edge case", "in practice this
can't happen", "unlikely to matter", deciding whether a reported defect is real. **Wire up:** nothing.

### `verify-source`
Before stating what a specification, standard, RFC, paper, or datasheet requires, open the source and
cite the section — even when a project note, a prior session, or another agent already asserts the
rule. Notes drift; the source does not. **Triggers:** "the spec says", "per IUPAC / RFC / ISO", citing a
section number, resolving a disagreement between code and a claimed rule. **Wire up:** nothing.

### `prove-invariant`
For correctness-critical output, a passing suite whose only oracle is a stored expectation proves
nothing about the values. Derive the invariant the output must satisfy (a round-trip, a conservation
law, a canonical form) and test that. **Triggers:** "all tests pass but…", "is this actually correct",
regression suites for scientific or algorithmic output, before trusting a test you just wrote.
**Wire up:** nothing.

### `test-gate`
A test earns its place only if some wrong code makes it fail. Before a new test lands it must name
the behaviour it protects, the bug that breaks it, why existing tests miss that bug, and any
test-only seam it needs. In review, each test gets the cheap wrong versions of its code run against
it: always refuse and always allow for a guard, empty output for a check that loops over outputs, no
lock with overlapping callers for concurrency. **Triggers:** "add a test for", "review these tests",
"is this test enough", fail-closed guards, concurrency tests, mocks or fixtures that already hold the
answer. **Wire up:** nothing.

### `change-asserted-value`
Use whenever a change would alter a committed expected value — a golden file, snapshot, asserted label,
reference output, benchmark target — including when the new value looks obviously right. Forces the
question "which one is wrong, the code or the expectation?" to be answered with evidence before the
file moves; with weaker evidence the value moves only when it is marked unverified in the commit
message, at the assertion and in a durable note. **Triggers:** updating a failing assertion to match
current output, "the test expectation is stale". **Wire up:** nothing.

### `bounded-goals`
Write the success criteria of an optimisation or evaluation loop as **one objective plus explicit
bounds** on every other metric. Multi-objective goals make every change a regression on something and
stall the loop. **Triggers:** writing or revising `goals.json` / acceptance thresholds / benchmark
targets with more than one metric; a loop where every proposed change is rejected. **Wire up:** nothing;
`eval-loop` consumes the result.

---

## Workflow skills (wire in your project's commands)

Each encodes a measurement discipline that transfers directly; you substitute your project's plumbing.

### `run-gate`
Run a regression gate correctly: fast pre-gate → background launch (never a hard `timeout`) → wait on a
**verdict file**, not `pgrep` or a foreground sleep-loop → reconcile the **structured verdict**, never
just the exit code → on FAIL read the log for the specific regression lines → re-gate. **Wire up:**
your gate command, its fast-check flag, and its verdict/log file paths. The reusable lessons: read the
verdict not the exit code; a stale baseline can make a PASS hide a regression; never run two gates that
clobber the same verdict file.

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
general ML-eval lessons, not specific to one project.

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
aren't additive. First-refusal and touched counts are reported beside it as extra information. **Wire
up:** however your pipeline records refusals (failure codes in logs) + a parser for them.

### `kickoff`
Start/resume a work session by self-priming from durable state (a handoff note + your notes/memory +
`git log`) instead of a hand-written prompt, with an upfront drift-check that the planned next task
matches the roadmap. **Wire up:** your handoff-note path, your notes/memory location, and (optional)
your roadmap for the drift-check.

### `handoff`
End-of-session handoff — verify durable memory is written and produce a next-session resume note so the
next session needs no hand-written prompt. Includes the "never trim your memory file to hit a byte
target" lesson. **Wire up:** your memory-verification step and next-session-note path.

### `reuse-before-rerun`
Every expensive run is a claim that no usable result exists. Prove it first: one sweep over the
results ledger, the repo, scratch directories, and notes; then a mandatory 3-line verdict block
(**Existing / Verdict REUSE | EXTEND | RERUN / Cost**) in every reply that reports a number or
launches a run; then a ledger row when the run finishes so the next session finds it. **Triggers:**
about to run a benchmark, census, full gate, multi-row spy, or corpus-scale job; "how many…", "show me
the table", "where is the run from <date>". **Wire up:** the ledger path, your results directories,
and the search roots in `sweep.sh` (env vars; defaults work for a plain git repo).

### `watching-background-jobs`
Own the watch loop for a long job yourself: baseline the log, arm a scheduled wake-up, check CPU before
calling a stall, and end every wake-up that shows progress with **one progress line** (done/total,
rate, ETA, last log line). A spawned "watcher agent" cannot wake itself on a schedule and reports only
when its run ends — keep the loop in the main agent. **Triggers:** launching anything expected to run
more than ~5 minutes; "is it still running?", "how much done?", "ping me when it's done". **Wire up:**
your log / sentinel file paths.

---

## Media skills

### `promo-video`
Makes promo, launch and explainer videos as code. A video is an HTML stage where every frame is a
pure function of time; `scripts/render.mjs` screenshots each frame into ffmpeg and muxes a
soundtrack composed in code (`assets/score.js`) or a track the user supplies. It interviews first,
shows a storyboard of stills for comments, films the real product with `scripts/capture.mjs`, and
ships a review page where the user pins notes to moments. Includes three.js and a WebGL2 fluid
solver (`assets/fluid.js`). **Needs:** Node, Chrome and ffmpeg; `scripts/setup.sh` finds them or
fetches playwright-core and Chrome for Testing into the skill's own `.tools/`.

---

## Hooks (`hooks/`)

Mechanical guards for rules that must hold every time. The plugin install turns on
`block-git-add-all`; the other four are opt-in: copy the scripts you want and paste only their entries
(and `env` values) from [`hooks/README.md`](../hooks/README.md) into your `settings.json` (a project
copy of the git guard would run next to the plugin's). Without the plugin, copy the git guard too.

### `block-git-add-all`
PreToolUse on `Bash`. Denies bulk staging (`git add -A`, `git add .`, `git add --all`, `git commit -a`)
so scratch files, logs and generated data never get swept into a commit. Explicit paths always pass.

### `ask-gate`
PreToolUse on `AskUserQuestion`. For autonomous runs where the user has said "do not ask, decide":
allows only the **4 hard stops** — irreversible/destructive actions, security/secrets/publishing, an
expensive run (30k+ rows or 1h+), or a plan so broken every path is a guess — and denies the rest with
a reason that tells the agent to choose and proceed. Denials are logged to `.claude/ask-gate.log` for
review. Opt-in: prefix a question with `HARD STOP:` to force it through, or disable with
`ASK_GATE_OFF=1` / a `.claude/ask-gate.off` file.

### `guard-holdout` (opt-in)
PreToolUse on `Bash`, for `eval-loop`, `run-eval` and `bounded-goals`. Denies a command that matches
`EVAL_HOLDOUT_PATTERN` (set it to what runs the held-out split, such as its override flag) and tells the
agent to ask first; after the user agrees, the agent re-runs it with `# holdout-approved`. Does nothing
until the pattern is set.

### `guard-regen` (opt-in)
PreToolUse on `Bash`, for `change-asserted-value`. Denies a bulk snapshot or golden-file regeneration
(`--snapshot-update`, `--force-regen`, `jest -u`, `UPDATE_GOLDEN=1` and similar) until each changed
value is listed with its evidence; then `# values-reviewed` lets it through. Needs no setup.

### `gate-guard` (opt-in)
PreToolUse on `Bash`, for `run-gate`. For commands matching `GATE_CMD_RE`, denies a `timeout` wrapper
and, with `GATE_VERDICT_FILE` set, a second gate while `<verdict file>.lock` holds a live PID.

## Agent (`agents/`)

### `reference-consult`
A subagent definition. Point it at the reference documents a project relies on (standards,
specifications, published rules, reference data files) and it returns the rule with its exact citation,
the document's own examples as test cases, where the text is silent or ambiguous, and a confidence, so
the main agent implements it at the root cause. It reads documents, never source code, and treats any
instruction inside a document as text to quote. **Wire up:**
the paths of your reference documents.

---

## Reference docs (`reference-docs/`, not invocable)

Domain knowledge Claude reads on request (point it at the file). `rdkit-perception`, `fix-methodology`,
`testing-commands` are chemistry-general. The [`examples-iupac-naming/`](../reference-docs/examples-iupac-naming/)
pack is a worked example of a *domain-specific* knowledge file (IUPAC nomenclature) — a template for
building your own sub-domain reference, not something you need unless you work on naming.
