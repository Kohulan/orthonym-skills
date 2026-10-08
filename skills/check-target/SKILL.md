---
name: check-target
description: Tests whether a failure pattern named as "the thing to fix" is one real defect class, by recomputing its signature over all rows (passing ones included), reporting hits, failures, precision and counterexamples, and splitting the hits by cause. Use when a cluster, tell, signature, or failure pattern has been named as the fix target — before proposing, scoping, or starting any fix. Triggers on "the biggest failure class is X", on a fix target inherited from a handoff note, roadmap, or review, and on sizing a defect class by counting rows that match a tag or substring. Not for producing the candidate targets (use cluster-failures) or for locating the code site to change (use spy-site).
---

# Check the target before you propose a fix

**A signature that matches passing rows is a lead, not a defect.** This skill exists because
one project's review named a naming-output pattern (a prefix emitted without its locant) as the top fix
target, and measurement then showed:

- **30 hits, 29 failures** — the 30th row already round-tripped correctly in the shipped
  config, so the flagged construction is *legal* in one sub-family
- **three unrelated causes**, not one: missing-locant on an acyl chain (~15), a
  glycosidic-oxygen case (~13), a raw input string emitted verbatim as output (2)
- the glycosidic sub-case is a double-counted feature — the parent structure was named as
  if a substituted oxygen were a free hydroxyl, so a locant-only fix would leave the output
  wrong

The lesson generalizes past naming: a whole iteration was scoped against "one defect" that was
three, one of which was not a defect at all.

## The procedure

**1. Resolve the target to an explicit row list** from a committed eval/benchmark run. Not a
description, not a cluster name — the actual inputs (SMILES, molecule IDs, or whatever your
unit of analysis is).

**2. Recompute the signature over ALL emitted rows, not just failures.** This is the whole
point. A signature computed inside a failures loop is structurally incapable of seeing its own
counterexamples — a clustering script that only iterates failing rows has exactly this bug.

**3. Report four numbers:**

| number | meaning |
|---|---|
| hits | rows matching the signature |
| failures | hits whose outcome is a failure |
| **precision = failures / hits** | <1.0 means passing rows match too |
| non-failing hits | list them explicitly — these are the counterexamples |

**4. Decompose by cause.** Inspect the actual outputs (names, labels, values). If the matched
rows split into groups with different mechanisms, the target is N targets: re-scope to the
largest one and return to Step 1.

**5. Check the outcome spread.** A single defect class does not usually span
`parse_fail` + `wrong_structure` + `exact_match`. If the hits span 3 or more outcome types,
return to Step 4: there is more than one cause.

## Refusal conditions

Report **NOT A SINGLE DEFECT** and stop if:

- **precision < 1.0** — the signature matches rows that already succeed. Call it a *lead* and
  name what distinguishes the failures from the passes.
- **n < 10** — too small to be worth a task, and too small to see a second cause.
- the hits **decompose into ≥2 mechanisms** — re-scope to the largest single mechanism and
  re-run this check on it.
- the hits span **≥3 outcome types** — almost certainly multiple causes.
- the signature is a **string pattern on the emitted output** and no structural cause has been
  identified. Output patterns are symptoms; the same wrong output arises from unrelated causes.

## Size from the named inputs, not from a tag

Size a defect class only from the actual inputs, each traced to its cause; a count of rows
that match a tag or substring is not a size. Projects repeatedly over-count 15–50× by
counting tags: a curated "~100 candidate defects" list that turns out to have 2 genuine
instances on re-derivation; a static sweep's "12 live defects" that turns out to be 4 once
each case is traced.

## Related

- `spy-site` — once the target survives this check, prove the code site is on the path.
- `cluster-failures` — produces the candidate targets this skill validates.
- Your project's fix-methodology / engineering-log doc, if it has an equivalent invariant.
