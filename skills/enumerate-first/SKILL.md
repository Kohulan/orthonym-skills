---
name: enumerate-first
description: "Replaces a reachability or likelihood argument with a seeded, generated sample of the input space and a failure count. Use when about to argue whether a case is reachable, likely, rare, or worth fixing — triggers on 'probably unreachable', 'edge case', 'in practice this can't happen', 'unlikely to matter', or deciding whether a reported defect is real. Also use before optimizing or tuning any decision point, to confirm it executes at all. Not for cases where a reproduction already exists."
---

# enumerate-first

## The rule

**Generate and measure instead of arguing.** Report counts, not adjectives.

Reachability arguments are cheap to make and almost always wrong, because they
reason from the design you intended rather than the code you have.

## Why this exists

A code review flagged a tie that could be resolved by input order. The argument
was that it was narrow and probably unreachable. Fuzzing 35,888 generated cases
found **1207 violations across three distinct defect classes** — none of them the
one that had been hypothesised, and most in a component the argument had
dismissed entirely.

Separately: a 625-configuration grid search was run to tune a selector that
executes zero times, and a tie-break line compared an array element with itself
and had been dead since it was written. Both were one measurement away.

## Procedure

1. **Define the space.** What varies — inputs, orderings, configurations,
   geometries? Write it down; the gaps in your list are where defects hide.
2. **Generate broadly, seeded.** Random with a fixed seed, or exhaustive if the
   space is small. Reproducibility matters more than elegance.
3. **Run the property, count the failures.** Print the count and a handful of
   concrete examples.
4. **Classify before fixing.** Group violations — three defect classes look like
   one bug until you group them.
5. **Keep it as a gate** if it is fast enough, and mutation-test it (see
   `prove-invariant`).

## Cheap before expensive

Order probes by cost and let the cheap one filter for the expensive one:

- Run the check that needs no oracle, no JVM, no network **first**.
- Escalate only the survivors to the expensive check.
- Batch the expensive check once over all survivors rather than per item.

A diagnostic that costs a subprocess launch per item will not be run often
enough to matter. Latency of the check *is* a correctness property, because it
determines how many times you look.

## Before tuning anything

Confirm the decision point executes. Instrument it and count invocations.
Documented central logic being called zero times is common, not exotic — check
before spending effort on its behaviour.

## Red flags

| Thought | Reality |
|---|---|
| "This is a narrow edge case" | You have a hypothesis, not a measurement. |
| "It would take an unusual input" | Generate unusual inputs. That is the whole job. |
| "The review overstated it" | Or understated it. Both are findings; only counting distinguishes them. |
| "I'll reason about which branch wins" | Enumerate the branches and let the oracle decide. |
| "Too slow to fuzz" | Then the sample is smaller, not absent. |
