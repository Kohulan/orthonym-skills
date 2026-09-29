---
name: change-asserted-value
description: "Requires three artifacts before a committed expected value moves (a primary-source quote, an independent check that does not use the code under test, and a mutation test) and records anything weaker as unverified. Use when a change would alter a golden file, snapshot, asserted label, reference output, or benchmark expectation, including when the new value looks obviously right or the old one looks obviously wrong. Triggers on updating a failing assertion to match current output, 'the test expectation is stale', or a fix that moves reference data. Not for writing new tests (use prove-invariant)."
---

# change-asserted-value

## The rule

**Three artifacts before the value moves. If you cannot produce all three, the
new value is unverified: change it only when it is marked unverified in the commit
message, at the assertion and in a durable note ("When you only have weak evidence"
below), and say so plainly.**

Updating an assertion to match new output is the single easiest way to convert a
bug into a specification.

## The three artifacts

1. **A primary-source result.** A verbatim quote fixing the correct value, or an
   explicit finding that the source is silent on it. Use `verify-source`.
2. **An independent check that does not use the code under test.** A
   necessary-condition property (`prove-invariant`), an internal-consistency
   argument, or a separate implementation. Re-deriving the value by hand from the
   same reasoning that produced the change does not count.
3. **A mutation test.** Revert the fix, confirm the test now fails, restore. This
   proves the new expectation has teeth.

Then state, in one line: **what would make this wrong?**

## Why this exists

Nine reference values were changed in one piece of work. Six were confirmed by an
independent property — the originals were provably impossible. Three were not:
the property was blind to them, and they rested only on a geometric argument.

The difference mattered. Reporting all nine as "verified" would have been false;
recording three as reasoning-only kept the claim honest and left a checkable item
behind. One supporting argument turned out to be wrong on inspection and had to
be retracted — which is exactly the outcome this checklist is designed to surface
before the change ships, not after.

## Grading your evidence

| Evidence | Strength |
|---|---|
| Worked example from the specification | Decisive |
| Necessary-condition property the old value violated | Decisive — the old value was impossible |
| Internal consistency (two inputs that must agree, didn't) | Strong |
| Independent reimplementation agrees | Strong |
| Necessary-condition property that passes both before and after | **None** — it cannot adjudicate |
| Your own re-derivation from the same reasoning | Weak — record as unverified |
| "The new output looks more sensible" | Not evidence |

## When you only have weak evidence

Ship the change with honest labels, if the reasoning is sound:

- Say in the commit message which values are machine-confirmed and which are unverified.
- Add a comment at the assertion marking it unverified and recording what it rests on.
- Write the open item somewhere durable, with the check that would settle it.
- In every summary, describe reasoning-backed values as unverified.

## Red flags

| Thought | Reality |
|---|---|
| "The test is just stale" | Tests do not go stale on their own. Something changed; find out what. |
| "Obviously the old value was wrong" | Prove it. "Impossible" is provable; "wrong-looking" is not. |
| "The reference implementation produces this" | So did the old value. |
| "I derived it carefully" | Careful derivation is what artifact 2 exists to check. |
| "It's only a sign / a symbol / a unit (e.g. a chirality label)" | Those are the errors that survive longest, because everything still parses. |
