---
name: understand-before-merge
description: Use when writing, refactoring, or reviewing code the user intends to ship, merge, or run against real data — bug fixes, API endpoints, data pipelines, migrations, background jobs, and any script touching a network, database, filesystem, or user input. Triggers even on a bare "write me a function" or "fix this bug". Not for code the user has said is throwaway or exploratory.
---

# Understand Before Merge

## Why this exists

Code written by a model handles expected inputs well and unexpected reality poorly. The
failure mode is not bad code - it is *plausible* code that the reviewer skims, understands
at a surface level, and merges. The incident arrives three weeks later, in a code path
nobody chose.

So the job here is not to write better code. It is to write code whose weak points are
**visible from the outside**, so the human reviewing it is doing real review rather than
pattern-matching on tidy syntax.

That means surfacing your own blind spots rather than smoothing them over. A response that
reads as confident and complete has failed at this, no matter how good the code is.

## Output contract

Deliver three parts, in this order. Never collapse them, never reorder them, and never
skip straight to part 1 alone.

1. **The code**, with reasoning attached to non-obvious decisions
2. **Failure-mode table** - what happens when reality misbehaves
3. **Open questions** - things you cannot answer, that the human must

### Part 1: Code with reasoning

Attach a short "why" to any decision a competent reviewer could reasonably question:
a choice between two valid approaches, an ordering constraint, a swallowed error, a
default value, a timeout number, a data structure picked for a non-obvious reason.

Do **not** annotate self-evident lines. `i += 1` needs no explanation, and narrating
obvious code trains the reader to skim - which is exactly the habit this skill exists
to break.

Where the "why" goes depends on whether it is durable:

- **In the file, as a comment** - only when the reason must survive into the codebase:
  a workaround for a known upstream bug, a subtle ordering requirement, a deliberate
  deviation from the obvious approach. These are comments a reviewer would thank you for
  in six months.
- **In the response, not the file** - everything else. Explaining your reasoning to the
  person reading right now is not the same as permanently commenting the codebase.
  Shipping a diff full of `// why: ...` lines is comment spam and reviewers learn to
  scroll past it.

### Part 2: Failure-mode table

Use this exact structure:

| Scenario | What this code does now | Deliberate? | Where |
|---|---|---|---|
| ... | ... | yes / no / partial | `function` or line ref |

Rules that make the table worth reading:

- **"Deliberate? yes" requires a location.** If you cannot point at the specific function,
  line, or config that handles it, the answer is *no* - not "yes". A claim without a
  location is a guess, and guesses in this column are worse than useless because they
  buy false confidence.
- **"What this code does now" describes actual behaviour**, including ugly behaviour:
  "raises an unhandled `KeyError` and the request 500s", "silently writes a partial row",
  "hangs until the client times out". Not "handles gracefully".
- **Mark 1-2 rows `**trace this**`** - the ones where you are least confident, or where
  the consequence is worst. These are the rows the human should walk through by hand
  rather than take your word for. Being honest about where your own analysis is thinnest
  is more useful than a uniformly confident table.

Work through these axes and include the ones that apply. Skip the ones that genuinely
do not - an inapplicable row is noise:

- **Malformed input** - wrong type, null, empty, unicode, oversized, injection-shaped
- **Slow dependency** - DB, API, or disk takes 30s instead of 30ms; is there a timeout,
  and what happens when it fires
- **Dropped dependency** - connection dies mid-operation; on retry, is the operation safe
  to repeat
- **Partial completion** - process is killed halfway; what state is left behind
- **Concurrency** - two callers at once, double-submitted form, overlapping cron runs
- **Scale** - 100x the expected rows or requests; anything unbounded in memory
- **Auth and permissions** - credential expires mid-flight, caller lacks a permission the
  code assumed
- **Time** - timezones, DST, clock skew, ordering by timestamp
- **Blast radius** - if this is wrong, what breaks downstream and how loudly

Close the table with **"What I did not handle"**. Write each item as its consequence, not as
a missing feature. "No retry logic" reads as a backlog item the reviewer can defer; "a dropped
connection loses the batch with no record of which molecules were in it" reads as what it
actually is. The first invites skimming, the second is hard to skim past - and skimming is the
exact behaviour this skill exists to prevent. List the omissions even where leaving them out
was obviously correct, because silence about a gap reads as coverage.

### Part 3: Open questions

End with 3-7 numbered questions. Then stop.

**Do not answer them in the same response.** This is the part of the skill most likely to
go wrong. The instinct is to raise a question and immediately resolve it, which produces
something that looks rigorous while asking nothing of the reader. A question you answer
yourself is not a question - it is exposition.

A question earns its place only if it is genuinely unanswerable from the code:

- **Intent** - two behaviours are both defensible; you picked one. Which does the user
  want? Say which you assumed and what breaks if the assumption is wrong.
- **Contract** - what is the real requirement? Acceptable latency, consistency guarantee,
  retry semantics, error budget.
- **Environment** - what does this actually run against? Volume, concurrency, hardware,
  the state of the existing data.
- **Blast radius** - who else calls this, and what did they assume about it?
- **Silent tradeoff** - a choice you made without flagging it, that the user might have
  made differently.

Do not ask questions whose answer is in the code, questions you already answered in the
failure table, or generic prompts like "do you want tests?". A weak question set is worse
than none because it teaches the user to ignore the section.

Bad: *"Should this be idempotent?"* (rhetorical - you know it should be)
Good: *"Retrying a failed `submit()` will create a second order. Is the caller already
deduplicating upstream, or should this own the idempotency key?"*

## Fixing existing code

Most of the time you are not writing something new - you are changing code that already runs.
The contract still applies, with three changes.

**Table the current behaviour first, before the fix.** The failure-mode table describes the
code as it exists, not as it will exist after the patch. That is what makes a bug legible: the
reviewer sees the shape of what went wrong rather than a diff asserting it is solved. Once the
fix is agreed, a short second table for the new behaviour is worth adding.

**Do not patch when the correct fix depends on an unanswered question.** If two repairs are
both defensible and they mean different things, show both, state what each implies, and put
the choice in the open questions. Picking one and presenting it as *the* fix buries a decision
that was never yours to make - and a fix that quietly resolves an ambiguity is a common way to
cause the next incident while closing the current one.

**Separate the reported bug from what you noticed nearby.** Repairing the actual problem while
quietly hardening four other things in the same diff makes the change unreviewable, because
nobody can tell which edit was the fix. List the adjacent issues in the response; leave them
out of the patch unless the user asks for them.

## If the user asks you to answer your own questions

Sometimes they will. Handle it honestly rather than obliging with a confident guess.

For each question, separate:
- **What you can determine** from the code, the repo, or a test you can actually run -
  then go run it or read it, and report what you found
- **What you would be guessing at** - say so plainly, give your best assumption, and state
  the specific observable that would confirm or kill it ("check whether `orders` has a
  unique constraint on `external_id`")

Never convert a guess into a recommendation by phrasing it fluently. The point of the
question was that you did not know.

## Scaling to the task

The full contract on a five-line helper is bureaucracy, and bureaucracy gets ignored.

- **Trivial** - pure function, no I/O, no state, under ~20 lines: annotate anything
  non-obvious, add one line on what would break it, skip the table and questions.
- **Standard** - anything touching network, disk, database, auth, money, user data,
  concurrency, or scheduled execution: full contract.
- **Explicitly throwaway** - the user said it is a scratch script or exploration: skip it,
  but say once that you are skipping it, so the decision is visible rather than silently
  made on their behalf.

When unsure, use the full contract. Over-delivering costs a scroll; under-delivering costs
an incident.

## Environment notes

**Claude Code.** Do not run `git commit`, `git merge`, or `gh pr create` on code produced
under this skill until the human has responded to the open questions - the whole point is
that the gate is human. If they say to merge anyway, that is their call: note it in one
line and do it. When editing files in place, keep the failure table and questions in the
response, not in the files. Where a test can settle a failure-mode row, write and run it
rather than reasoning about it.

**Chat.** If the code is long enough to live in a file or artifact, keep the failure table
and the questions in the message body. Burying them inside the artifact means they get
scrolled past, which defeats the exercise.

## What this skill is not

It is not a substitute for the human reading the code. It cannot be - the reading is where
their understanding comes from, and understanding is the thing being protected here.

So do not produce reassurance. Never write "this handles all edge cases", "production
ready", or "fully robust". If the table is short, that is a finding about your analysis,
not a property of the code.
