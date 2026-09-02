---
name: reuse-before-rerun
description: Use before launching any measurement over a minute long — benchmark, failure census, spy over many rows, head-to-head against another engine, determinism eval, shard generator, full gate, large-corpus run — and whenever the user asks for a number, a table, or "the run from <date>". Also use the moment you think "let me re-measure", "fresh spy", or "quick sanity run", or when a prior result cannot be found.
---

# Reuse before rerun

## Overview

Every expensive run is a claim: **"no usable result exists."** Prove that claim in one sweep
before spending compute. Most numbers a mature project needs were already measured; the failure
mode is not finding them and re-running for hours.

**Violating the letter of this rule violates the spirit.** A "quick 500-row sanity run" on a
question that already has a full-corpus answer is a rerun. A spy over ~100+ rows counts too.
**Not needed for:** a single-input probe, unit tests, the fast pre-gate.

## Wire this in

`sweep.sh` reads its roots from env vars — set them once:

- `RBR_REPO` — repo to search (default: git toplevel, else `$PWD`)
- `RBR_LEDGER` — the ledger (default: `$RBR_REPO/RESULTS-LEDGER.md`)
- `RBR_EXTRA_ROOTS` — colon-separated extra dirs: session scratchpads, a notes/memory dir, an
  artifact store. **Set this** — a large share of results land outside the repo.

`<skills-dir>` in the commands below is wherever this skill was installed: `.claude/skills` for a
project copy, `~/.claude/skills` for a user copy, or `${CLAUDE_PLUGIN_ROOT}/skills` under the plugin.

Also substitute your expensive commands below, and your notes / memory tool in step 2.

## The protocol (in order, no skipping)

1. **Name the question in one line:** corpus + size + engine/config + metric + code state (a
   HEAD hash, or "any" if the question is about the past).
2. **Sweep once** — one Bash call, then ONE query to your notes / memory tool
   (`"<keyword> result"`):
   ```bash
   bash <skills-dir>/reuse-before-rerun/sweep.sh <keyword> [since YYYY-MM-DD] [until YYYY-MM-DD]
   ```
   It reads the ledger, then the repo, then every extra root — newest first.
3. **Pick one outcome:**
   - **REUSE** — same corpus and size exists, and `git log --oneline --since=<run date> -- <src>`
     is empty, or the question is about the past. Report path, date, HEAD.
   - **EXTEND** — a subset, or a paused/partial run (shard files in a scratchpad), exists. Run
     only the delta: new rows, failing rows, or missing shards.
   - **RERUN** — nothing usable exists. Say which of the five places came up empty.
   - Commits since the run date do NOT make it RERUN by themselves. Report the last full number
     plus the measured reclaim of each shipped fix, and mark it "incremental, not re-measured".
4. **Write the verdict block** — REQUIRED in every reply that reports a number or launches a run,
   REUSE included, even when nothing is launched. Exactly these 3 lines, right after the numbers:
   ```
   Existing: <path · date · HEAD>  |  none — 0 hits for "<keyword>" in ledger, repo, scratchpads, notes, memory tool
   Verdict:  REUSE | EXTEND <delta rows> | RERUN because <none exists | corpus changed>
   Cost:     0 (reused)  |  <rows> rows · ~<minutes> min · <cores> cores
   ```
   A run past your expensive threshold (tens of thousands of rows, or an hour+) needs the user's
   OK this session unless pre-approved. "You'll need a fresh run" without the verdict block is a
   violation.
5. **Register when it finishes** — append one row to `<results-ledger path>` in the same turn.
   The next sweep then finds it in step 2.

## Answering "where is the run from <date>"

Same command with the date window — `sweep.sh <keyword> 2026-01-13 2026-01-15` — across ALL
roots, not only the repo. "I can't find it" is not "it does not exist" until the ledger, the repo,
every scratchpad, your notes and your memory tool all came up empty. Name each one you checked.

## Ledger format

Create it once — newest first, append-only, one row per expensive run:

```markdown
| date | tag | engine | HEAD | rows | headline | path |
|---|---|---|---|---|---|---|
| 2026-01-14 | <corpus>-<size> | <engine/config> | <short hash> | 500 | <the numbers a reader needs> | <artifact path> |
```

`tag` = corpus + size, as your file names spell it; `HEAD` = the short commit measured (`—` if
unknown); `path` = the artifact to open. **Never delete a row** — a missing row is how a run gets
repeated.

## Red flags — STOP and run the sweep

- The command you are typing is a benchmark / census / measure / shard script, or names a large
  corpus file, and no verdict block is in the chat.
- You are about to write "needs a fresh measurement" or "not yet measured" with no verdict block.
- "Let me re-measure to be sure." / "A fresh spy is more trustworthy." / "Quick sanity run."
- You cannot name the prior result you looked at.
- The user said "again and again" or "you already have" this session.

## Rationalization table

| Excuse | Reality |
|---|---|
| "The old number may be stale" | `git log --since=<date> -- <measured path>`. No commits → same number. Commits → EXTEND on the affected rows. |
| "Re-measuring is cheap insurance" | A full-corpus run is hours. Unasked full runs are banned. |
| "I searched and did not find it" | Ledger, repo, scratchpads, notes, memory tool — name each. Many outputs land in scratchpads. |
| "Spy-before-code needs a fresh spy" | An existing spy at the same HEAD satisfies it. Re-spy only on 2+ positives when it is load-bearing. |
| "The user asked for the number" | They asked for the answer. The answer usually already exists. |
| "This run is different (corpus/size)" | Then EXTEND from the existing subset, and state the delta. |
| "It is only 500 rows" | If the full corpus was measured, 500 rows adds noise, not information. |
| "The numbers predate the last fix, so re-run the full corpus" | Past the expensive threshold: needs the user's OK. Report the incremental number — last full run plus each fix's measured reclaim — in the verdict block first. |
| "Engine X was never run at full size" | Five agents said that; the summary was in a session scratchpad. Sweep before saying "not measured". |
| "A note already gives the number" | Open the file it points at. A note is a pointer, not a result — VERIFIED vs ASSUMED. |
| "I'll add the ledger row later" | Later is the next session re-running it. Append it in the same turn the run finishes. |
