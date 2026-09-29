---
name: kickoff
description: Starts or resumes a chemistry-dev work session by self-priming from the project's handoff note, durable memory/notes and git, with a drift check against the roadmap before the next task begins, in place of a hand-written resume prompt. Use when a session starts, or when the user says "continue", "resume", "kickoff", "where were we", or opens a session without giving a task. Not for wrapping up a session (use handoff).
---

# Session kickoff

Self-prime from durable state instead of asking the user for context. Do all of this
before any other action, then proceed with the work. Stop to ask only when the next step
needs the user: a destructive or irreversible action, a real change of scope, or input
only they can give.

Wire this up: substitute your project's actual paths/files for the placeholders below (a
handoff note, a roadmap/plan doc, a durable-memory store). If any of them don't exist
yet, skip that step and fall back to git plus whatever notes do exist.

## Steps

0. **Drift check first (cheap agent).** Before anything else, spawn a small/cheap
   subagent (a fast, cheap model is sufficient — this is a read-only check) with the
   protocol in `drift-check.md`. Put that file's full path and your roadmap and handoff-note
   paths in its prompt, because a subagent sees none of this conversation. Let it run in the
   background while you do steps 1–4, and surface its verdict (`PASS` / `DRIFT` /
   `STALE-ANCHOR`) in your confirmation. If it reports DRIFT or STALE-ANCHOR, make the one
   correction it names before starting work; start no task until the verdict is in.
   If your project has an authoritative roadmap/plan doc, name it here so the drift-check
   agent knows where to look, and never let it re-open a decision your project has
   explicitly locked. **Its anchor check matters most: verify the handoff note against git
   before trusting it**, because every later step builds on the note (step 3 says what to
   do when it is stale).
1. **Read your project's handoff note** (e.g. `HANDOFF.md`, a "resume" doc, or
   whatever your project's end-of-session skill writes). It should be the primary state:
   current milestone/phase, last commit, any gate/benchmark baseline, the next task, and
   active hazards/lessons.
2. **Read both memory layers, every kickoff.**
   - **(a) File-based notes — the source of truth:** at minimum whatever "start here" note
     the handoff points at for the current milestone, wherever your project keeps durable
     cross-session memory (a memory file, a wiki, a project-notes doc, or similar).
   - **(b) A semantic recall tool, if your project has one** (a searchable memory of past
     sessions): query it once for "<current milestone> lessons / refuted premises"
     before starting the task and read the top hits. The previous session's lessons are
     written there at handoff, so that is where "have we tried / refuted this?" is answered
     fastest. Treat each hit as a lead to verify against the file notes and git before
     acting (see *Cross-session recall* below).
3. **Verify against git**: `git log -5 --oneline` and `git status --short`.
   - If the handoff note's "last commit" is not in the log, or the tree has unexplained
     changes, the note is stale: trust git plus the durable notes, say so in one
     sentence, and reconstruct state from there.
4. **Apply your project's session invariants** (its standing-rules doc, if it has one).
   They always apply; never wait for the user to restate them.
5. **Confirm in ≤5 lines**: milestone/phase, last commit hash, any baseline number, the
   next task you are about to start — then start it.
6. **Hand off into your project's plan→build workflow if it has one and the next task is
   an implementation phase.** Many projects pair a brainstorming/spec step with a
   planning step and an execution step (for example: a brainstorming skill → a
   plan-writing skill → a subagent-driven-execution skill, or an equivalent your project
   already uses). If your project has a standing "execute autonomously, don't wait for
   approval on routine work" directive, apply it — but never let it override a project's
   hard stops (a no-regression/fail-closed gate, a protected/gold test set, a locked
   decision) — those always still apply. If your project runs implementation across
   multiple agents, keep that serial in one working tree unless you have *verified*
   worktree-plus-environment isolation: a common trap is an editable install that still
   points at the main tree, so a "worktree" edit lands in one copy while tests silently
   exercise another — verify isolation before trusting any parallel-implementer setup.

## Cross-session recall (if your project has a memory/search tool)

Some projects layer a semantic-search or auto-capture tool over file-based notes (a
memory plugin, a notes-search integration, etc.). Treat file-based notes as the source of
truth and any such tool as a **recall aid** on top of it:

- **Before starting the next task, and before any load-bearing decision, query it once**
  for the task's topic — to catch "have we tried / refuted this before?" faster than
  grepping every note file by hand. A confident-but-wrong premise re-derived from scratch
  is one of the more expensive mistakes a session can make; a one-query recall check is
  cheap insurance against it.
- It is a **read/recall aid, not a writer of record** — durable findings still go to your
  file-based memory (and a committed doc, if your project keeps one). Never treat a
  recalled observation as authoritative over your committed notes or git history; verify
  a recalled claim before acting on it.

## Work efficiently — reduce waste, parallelize the read side

- **Run any expensive full validation/gate once per milestone, not per small change.**
  Per change: cheap/fast probes only (unit tests, a short targeted spot-check on the new
  cases). Skip a heavier diff-against-gold check for changes that can't touch the
  protected tier by construction.
- **Default to parallel agents for independent read work** — a wide investigation,
  review, measurement, reference/literature consult — when they touch no shared files;
  that is the intended speed-up. Do a job that takes only a handful of tool calls yourself.
- **Hard limits regardless of the above:** never run parallel implementers in one
  working tree (they collide on shared files, and even "isolated" worktrees don't rescue
  you if the environment underneath isn't actually isolated); never size a fan-out by an
  unknown (agent count should not scale with how uncertain you are); only one process
  should ever run a full/expensive gate at a time (two running together can clobber the
  same verdict/log file).
- **Don't hand-roll long loops calling a slow external tool** (an external parser,
  validator, or heavyweight subprocess invoked per-item in a loop) — this is exactly the
  kind of thing that deadlocks on a pipe or leaks resources under concurrency. Use your
  project's existing batch-safe path if it has one. **Don't poll-wait** on background
  jobs — rely on a completion notification or a single watch-until-done step (see
  `watching-background-jobs`).

## If your project's handoff note does not exist

Fall back to: your durable-memory index (if any) → its "start here" pointer → `git log
-10 --oneline`. State the reconstructed context in ≤5 lines and proceed.
