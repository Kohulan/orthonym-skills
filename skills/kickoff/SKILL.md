---
name: kickoff
description: Starts or resumes a chemistry-dev work session by self-priming from the project's handoff note, durable notes and git, with a drift check against the roadmap before the next task begins, in place of a hand-written resume prompt. Use at session start when no task has been given yet. Triggers on "continue", "resume", "kickoff", "where were we", or "pick up from the handoff note". Not for wrapping up a session (use handoff).
---

# Session kickoff

Self-prime from durable state instead of asking the user for context. Do all of this
before any other action, then proceed with the work. If your project's standing directive is
"research and decide", stop to ask only when the next step needs the user: a destructive
or irreversible action, a real change of scope, or input only they can give.

Wire this up: substitute your project's actual paths/files for the placeholders below (a
handoff note, a roadmap/plan doc, your notes). If any of them don't exist
yet, skip that step and fall back to git plus whatever notes do exist.

## Steps

Copy this checklist and track your progress:
```
- [ ] 0 Drift check launched
- [ ] 1 Handoff note read
- [ ] 2 Notes read; recall tool queried once
- [ ] 3 Note matches git log / git status
- [ ] 4 Session invariants applied
- [ ] 5 Drift verdict in; ≤5-line confirmation sent
- [ ] 6 Next task started
```

0. **Drift check first (cheap agent).** Before anything else, spawn a small/cheap
   subagent (a fast, cheap model is sufficient — this is a read-only check) with the
   protocol in `drift-check.md`. Put that file's full path and your roadmap and handoff-note
   paths in its prompt, because a subagent sees none of this conversation. Let it run in the
   background while you do steps 1–4, and surface its verdict (`PASS` / `DRIFT` /
   `STALE-ANCHOR`) in your confirmation. If it reports DRIFT or STALE-ANCHOR, make the one
   correction it names, re-check that one item, and return to Step 5 only when it passes;
   start no task until the verdict is in.
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
     the handoff points at for the current milestone, wherever your project keeps its
     notes (a memory file, a wiki, a project-notes doc, or similar).
   - **(b) A recall tool, if your project has one** (a searchable memory of past
     sessions): query it once for "<current milestone> lessons / refuted premises"
     before starting the task and read the top hits, and again before any load-bearing
     decision. The previous session's lessons are written there at handoff, so that is
     where "have we tried / refuted this?" is answered fastest. Treat each hit as a lead
     to verify against the notes and git before acting; it never outranks them.
3. **Verify against git**: `git log -5 --oneline` and `git status --short`.
   - The note's "Last commit" is the last work commit; the commit that adds the note
     usually follows it. The note is current when every commit after it touches only the
     note (`git log --oneline <last-commit>..HEAD -- . ':!<your-handoff-note>'` is empty).
   - If its last commit is not in the log, later commits touch other files, or the tree
     has unexplained changes, the note is stale: trust git plus your notes, say so in one
     sentence, and reconstruct state from there.
4. **Apply your project's session invariants** (its standing-rules doc, if it has one).
   They always apply; never wait for the user to restate them.
5. **Confirm in ≤5 lines**: milestone/phase, last commit hash, any baseline number, the
   next task you are about to start — then start it.
6. **Implementation phase next? Hand off into your project's plan→build workflow** if it
   has one (for example a brainstorming skill → a plan-writing skill → a
   subagent-driven-execution skill). A standing "execute autonomously" directive never
   overrides a hard stop: a no-regression/fail-closed gate, a protected/gold test set, a
   locked decision.

## Hard limits (they apply from session start)

- **Never run parallel implementers in one working tree.** A worktree does not rescue you
  unless the environment under it is isolated too: an editable install that still points
  at the main tree makes a worktree edit invisible to the tests. Verify isolation first.
- **Only one full/expensive gate at a time**: two runs clobber the same verdict/log file.
  Run it once per milestone; per change, cheap probes only.
- **Don't poll-wait** on background jobs: take the completion notification or one
  watch-until-done step (see `watching-background-jobs`).
