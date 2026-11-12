---
name: trace-friction
description: Reviews a hard work session from its own log and proposes changes to the agent's environment (a check, a hook, a tool, a skill edit, a pointer, a removal), each tied to a logged moment and its measured cost. Use when the user asks for a retro or retrospective, asks "why did that take so long", "how do we stop this happening again" or "what should we change so the agent does not repeat this", when the user asks to add or strengthen a rule in CLAUDE.md, AGENTS.md or a notes file because the agent repeated a mistake, and when a mistake has come back after a note already recorded it. Not for saving what happened (use handoff), and not for a verdict on the code the session produced (use fable-review or understand-before-merge).
---

# Trace the friction: change the environment, not the memory

**A lesson in a note is a hope. A check that fails is a fact.** A friction trace turns the hard
moments of one session into the strongest fix that can hold, and removes steering that did
nothing. It proposes only. Nothing changes until the user picks a candidate.

Two rules bind every step:

- **No moment, no candidate.** Each candidate names a ledger row. A fix category with no
  row stays empty. "Nothing to change" is a complete, correct trace.
- **The log is the source, not recall.** By the end of a session the middle is forgotten
  or compacted away, so the ledger comes from the session log.

Wire this up: point step 2 and step 8 at your project's friction log (for example
`docs/friction-log.md`, or a section of your durable notes), and step 3 at where your durable
notes and steering files live.

## Steps

1. **Build the friction ledger.** Run the scanner on the session log:

   ```bash
   python3 scripts/friction.py --latest          # newest Claude Code log of this project
   python3 scripts/friction.py path/to/log.jsonl # an earlier session
   ```

   It lists candidate moments with log line numbers: failed calls, the same call made
   twice, long read/search runs before an edit, user corrections and interrupts, refused
   calls, hook blocks, oversized tool results, edit churn, compactions. It finds; it does
   not judge. Read the log around each line, drop the rows that were normal work, and write
   the ledger:

   | # | Where | What happened (quote) | Cost | Cause |
   |---|---|---|---|---|
   | 1 | L1917 | 27 searches for the suffix table | 27 calls | no pointer from the rules index |

   Cost is a count from the log: calls, failed calls, user corrections, minutes, characters
   returned. In another harness, or with no log on disk, build the same table by hand from
   the conversation and say so in the report.

   **Ledger empty: report "smooth session, nothing to change", give the counts that show
   it, and stop.** That is the whole report: no report format, no caveats, no follow-up
   ideas, no other skill to try.

2. **Check the fixes from earlier traces.** Read the friction log. Mark each earlier fix:
   *held* (its moment is absent), *recurred* (its moment is a row again: the fix failed, so
   the new candidate goes one rung higher), or *caused a row* (it blocked good work or cost
   more than it saved: it becomes a removal). No friction log yet: skip this step.

3. **Check for a lesson already written.** Search the durable notes, the handoff note and
   the steering files for each row's lesson. A lesson that was written down and broken
   again proves prose does not hold it. That row's candidate must sit on a higher rung
   than the place the lesson sits now. A second, stronger sentence is not a candidate.

4. **Read what exists before proposing a check.** The hook config, pre-commit config, CI
   workflows, and the lint, type and test commands. A check that exists but is unwired or
   broken makes "wire it" the finding. A repo with no check that runs by itself is one
   finding of its own.

5. **Pick the rung.** Give each row the highest rung that can hold its fix:

   | Rung | Form | Fits when |
   |---|---|---|
   | 1 | Check that fails: lint rule, test, type, pre-commit, CI job, hook | The mistake is mechanical: a fixed pattern, a banned command, a file location |
   | 2 | Tool or access: a script, a log teed to a file, read-only access, a cheaper command | Information was out of reach, or a call cost too much for what it returned |
   | 3 | Skill: edit one, fix its description, or write one | A judgement procedure was skipped or done out of order; a skill that should have fired did not |
   | 4 | Reviewer rule, in the file the review step reads | A judgement call that shows in a diff |
   | 5 | Pointer: one line in an always-loaded steering file | The agent could not find a file or fact |
   | – | Removal | A steering line, hook or check that no row used, or that caused a row |

   Always-loaded steering files (`CLAUDE.md`, `AGENTS.md`) take pointers only. A rule
   there costs every session and holds nothing.

6. **Replay each candidate against its row.** Write one line: at row N, with this fix in
   place, what happens differently? If that line cannot be written, drop the candidate and
   list the row under "Rows with no fix". Then write the *holds if*: what the next session's
   log must show ("zero bulk `git add`", "suffix table found in 3 calls or fewer"). Then
   the cost of the fix itself: tokens per session, risk of blocking good work.

7. **Present** in the report format below, ranked by row cost, recurred rows first. Apply
   nothing.

8. **After the user picks.** Apply only the picked candidates. A new check is code: show it
   fail on the bad case and pass on the current tree (see `test-gate`) before it may block
   anything. Append each applied fix to the friction log with date, row, rung and *holds if*.
   Step 2 of the next trace reads that line.

## Report format

```markdown
## Friction trace: <session, date>. <N> rows, <total cost>. Ledger from: <log path | by hand>

### Earlier fixes
- <fix>: held | recurred (row #) | caused row # (remove)

### Candidates
1. **<the fix, one line>** (rung <n>, <form>)
   - Moment: row #, <where>: "<quote>"
   - Cost: <count from the log>. Written before: <no | path of the note>
   - Replay: <what changes at that moment>
   - Holds if: <what the next log must show>
   - Fix cost: <tokens per session, block risk>

### Removals
- <line, hook or check>: <unused by every row | caused row #>   (or "none found")

### Rows with no fix
- row #: <one-off | normal work | no replay>
```

## Stop and redo the step if

- A candidate has no row. It is generic advice. Delete it.
- A candidate is a sentence in a steering file and rungs 1 to 4 were not ruled out first.
- A candidate repeats a lesson that step 3 found already written.
- Every rung has a candidate. Real sessions do not fail on every axis.
- A new check is proposed and step 4 was not done.
- The user asked for "a stronger line" and the report agrees without step 3. Say what
  step 3 found, propose the higher rung, and offer to delete the line that did not hold.

## Related

- `handoff` stores the session's lessons. Run `trace-friction` first, so the handoff note names the
  fixes the user picked.
- `test-gate` proves a new check can fail before it guards anything.
- Hooks in this plugin (`hooks/`) are rung 1 forms ready to wire.

The seven question areas come from the `retro` skill in Matt Pocock's `skills` repo (MIT).
The ledger, the scanner, the rungs, the replay and the friction log are added here.
