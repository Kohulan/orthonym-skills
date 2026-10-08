---
name: prove-invariant
description: "Derives a property the output must satisfy by necessity (symmetry, invariance, counting, an algebraic identity), gates the output on it, and mutation-tests the gate. Use when adding or reviewing tests for correctness-critical output, when a suite passes but the values may still be wrong, or when stored expectations (golden files, snapshots, asserted labels) are the only oracle. Triggers on 'all tests pass but', 'is this actually correct', regression suites for scientific or algorithmic output, and before trusting any newly written test. Not for changing an existing expected value (use change-asserted-value) or checking that a test can fail at all (use test-gate)."
---

# prove-invariant

## The rule

**Find a property that must hold by necessity, independent of the
implementation.** Then gate on it, and mutation-test the gate.

Stored expectations only tell you the output has not changed. They cannot tell
you it was ever right — and once committed, a wrong value looks exactly like the
specification.

## Why this exists

A stereo-descriptor suite was fully green, and had been for years. Adding one
property — *reflection pairs mirror images, so across all permutations of a
constitution each index must carry as many `-C` labels as `-A` labels* — exposed
five wrong values immediately. It needed no shuffling and ran in under a second,
where a 35,888-case sweep costing twelve seconds could not see them at all.

Separately, a naming system round-trips 100% of 1.1M outputs while emitting zero
correct descriptors of the required class. **Self-consistency is not
correctness.**

## Where invariants come from

Look for a transformation the answer must respect:

| Source | Question to ask | Example |
|---|---|---|
| **Symmetry** | What operation maps the object to itself, or to a partner? | Reflection pairs enantiomers → label counts must balance |
| **Invariance** | What can I change that must *not* change the answer? | Input order, units, encoding, traversal order |
| **Counting** | Does a census match a known total? | Number of stereoisomers for a constitution |
| **Round-trip** | Does encode→decode return the original? | Weak on its own — see below |
| **Algebraic** | Is there an identity the output must satisfy? | Conservation, idempotence, monotonicity |
| **Internal consistency** | Must two outputs agree by construction? | Two encodings of the same structure must get the same label |

## Procedure

1. **State the property in one sentence**, as a necessity — "reflection is an
   involution on the permutation indices, so counts must balance."
2. **Implement it as a gate** over a broad sample, not a handful of cases.
3. **Mutation-test it.** On a scratch copy (see `test-gate`), inject a violation or
   revert the fix, and confirm the gate fails. If it passes, the gate is blind to that
   bug: tighten it and repeat. A gate you have not seen fail is a gate you have not tested.
4. **State necessary vs sufficient, out loud, in the test's own docs.** Say what
   it cannot catch.

## Necessary is not sufficient

Mirror balance proves the labels are self-consistent; a systematic swap of the
two symbols would still balance. So a passing property narrows the space of
possible bugs — it does not empty it. Pair every necessary-condition gate with
at least one external oracle (a worked example from the specification) that pins
the convention itself.

Write both facts down. A gate whose limits are undocumented will be over-trusted
by the next person, including you.

## Red flags

| Thought | Reality |
|---|---|
| "The whole suite is green" | Green against what it was told to expect. |
| "These values came from the reference implementation" | Then they encode its bugs too. |
| "Round-trip passes" | Round-trip cannot see class errors. |
| "I can't think of a property" | Try the symmetry row first — it is the most productive. |
| "The property passed, so we're correct" | Necessary, not sufficient. Say which. |
