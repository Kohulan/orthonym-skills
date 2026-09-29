---
name: handoff
description: Ends a chemistry-dev work session by verifying that memory/notes are up to date and writing a handoff note, so the next session needs no hand-written prompt. Use when the user wants to wrap up, clear, or "start a new session", or asks "is everything stored in memory?" / "give me a prompt for the next session". Not for resuming at the start of a session (use kickoff).
---

# Session handoff

Produce a durable handoff so the next session can start with your project's `kickoff`
skill (or a bare "continue") instead of a hand-written multi-KB prompt.

Wire this up: point step 3's file at wherever your project keeps its handoff note (e.g.
`HANDOFF.md`, a "resume" doc) and step 2 at wherever it keeps durable cross-session
memory (a memory file, a wiki page, a project-notes doc).

## Steps

1. **Commit check.** `git status --short` — everything intended for this session is
   committed (explicit paths — avoid a blanket "add everything" if your project's tree
   carries generated/scratch files it doesn't want swept in). If work is half-done,
   commit a clearly-labeled WIP or note it in step 3's "in flight."
2. **Memory/notes check.** Update whatever durable "start here" note covers the current
   milestone with what shipped (commits, any baseline movement, lessons learned). New
   detail goes in that note and the handoff note; if your project keeps a top-level
   index file, it should stay an index that points at the detail, not carry the detail
   itself.

   ⚠ **Do not trim a durable memory/notes file to hit a byte or length target.** Adding
   to it is fine; compressing existing entries to save space is not, unless an entry is
   simply wrong or superseded. A compression pass that squeezes old entries into
   one-liners can truncate hard-won detail mid-sentence — and if that file lives outside
   version control, the loss is not recoverable from git. Only ever *rewrite* an entry
   when it is wrong or superseded, never merely long. Moving genuinely new bulk into a
   separate topic note (rather than inlining everything into one file) is fine — that's
   composition, not trimming.

2b. **Capture every session lesson into both memory layers.** A lesson = anything the next
   session must not re-learn: a refuted premise, a spy that changed a plan, a corpus error,
   a working-style correction, a measured ceiling. Write each into **(a)** its durable note,
   with **Why** + **How to apply**, and **(b)** your project's semantic memory tool, if it
   has one, so `kickoff`'s searchable layer has it. Notes are the source of truth; never
   leave one only in a task report or gitignored ledger. Add to the existing note on a
   topic rather than creating a duplicate.
3. **Write your project's handoff note** (overwrite; keep it short, roughly ≤30 lines)
   from this template:

   ```markdown
   # Next session — written <UTC date>, by session handoff
   - Milestone/phase: <e.g. current phase name>
   - Last commit: <hash> "<subject>" (branch, pushed: yes/no)
   - Baseline: <N> (whatever your project's headline gate/benchmark number is, and
     whether it currently passes)
   - NEXT task: <one paragraph — the single thing to start on>
   - Read first: <durable-memory note(s) + any plan/design docs, with paths>
   - In flight / hazards: <uncommitted files, pending evals, fresh lessons>
   ```
4. **Commit** the handoff note (explicit path).
5. **Carry working-style directives forward.** If your project has standing efficiency
   or process rules (e.g. "run the full gate once per milestone, not per change",
   "default to parallel agents for independent read-only work but never for
   implementers in one tree"), point the handoff note's "Read first" at wherever those
   rules live, so the next session inherits them even if they're also wired into
   `kickoff` directly — a named pointer survives a session boundary better than an
   assumption that it will be re-derived from scratch.
6. **Tell the user** in a few lines: which notes you updated, the handoff note's path
   and commit, and that the next session can start with `kickoff` or "continue" with no
   hand-written prompt. Write a long starter prompt only if the user still asks for one.
