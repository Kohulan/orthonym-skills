---
name: bounded-goals
description: "Use when writing or revising the success criteria of an optimization or evaluation loop — goals.json, acceptance thresholds, benchmark targets, or agent objectives — especially with more than one metric. Also use when an iteration loop has stalled and every proposed change is being rejected for regressing something."
---

# bounded-goals

## The rule

**Maximize one metric. Bound the rest with explicitly relaxable ceilings, plus a
written trade licence.**

A conjunction of soft objectives — *maximize A and minimize B and minimize C* —
is an implicit veto on every Pareto move. It does not express a preference; it
forbids progress.

## Why this exists

A naming-system project documented the failure directly: under the unbounded
multi-objective form, the agent reverted **any** change that regressed **any**
metric, and froze. Rewritten as one maximized metric with relaxable bounds, the
runtime ceiling was deliberately loosened 3.7 → 5.0 → 6.2 → 20.6 ms to let
accuracy move, then optimized back down to 10.2 ms at the end. Accuracy went
95.0% → 97.8% while mean name length *fell* 98.2 → 83.0 characters.

A sibling project's criteria read `G1 >= baseline AND G2 >= 0.45 AND G3 >= 0.95`,
conjunctive, with no written trade licence. That is the freeze configuration.

## The contract

```
maximize:  ONE metric — the thing the project is actually for
bounds:    every other metric, each with a ceiling marked relaxable-or-not
licence:   plain sentences — "may regress X to Y in order to move Z"
held-out:  a split the loop never reads; run by a human at intervals
stamp:     derived:true on subset runs, so a subset number can never be
           quoted as a headline result
```

## Rules of thumb

- **One maximand.** If two things both feel primary, the project has not decided
  what it is for. Decide before optimizing.
- **Bounds are dials, not walls.** Write the relaxation policy at the same time
  as the bound, or it will be treated as sacred at the worst moment.
- **Add a proxy bound for quality that the maximand cannot see.** Output length,
  runtime per item, abstention rate. Cheap, and it catches degenerate wins.
- **Never rank on the proxy.** Bounding output length is healthy; *selecting*
  candidates by length produces truncated garbage that still passes the oracle.
  Bound it, do not optimize it.
- **Keep the held-out set genuinely held out.** Once it has informed a decision,
  it is a dev set and you no longer have a held-out set.
- **Diagnostics ride free.** One expensive pass should emit status, outputs,
  proxies, telemetry and failures together, so a new question costs nothing.

## When the loop stalls

A plateau is a signal about the *objective*, not the implementation. Before
trying harder:

1. Check whether a bound is doing the blocking, and whether it is relaxable.
2. Check whether the metric can still move at all — is there headroom, or is the
   remaining failure mass a class the current architecture cannot express?
3. If neither, hand off: a reviewer defines a new objective, and a **fresh**
   context implements it. Accumulated context is part of what plateaued.

## Red flags

| Thought | Reality |
|---|---|
| "All three metrics must not regress" | You have written a veto, not a goal. |
| "The bound is a hard requirement" | Then say who can relax it, and when. |
| "We improved on the subset" | Subset numbers are not headline numbers. Stamp them. |
| "Accuracy went up on the benchmark we tune against" | Of course it did. What did the held-out set say? |
| "Let's optimize the proxy too" | Proxies are bounds. Optimizing them is Goodhart's law with extra steps. |
