---
name: fable-review
description: Gets one adversarial review of a load-bearing plan, diagnosis, or finding from a reviewer on a different model family (fable by default), told to refute its premise. Use when a plan, diagnosis, or finding is about to ship and its premise, if wrong, would waste the next iteration. Triggers on "fable-review", "review the plan with fable", "get a second opinion", a diagnosis about to size or scope a build, and any claim repeated across sessions without being re-derived. Not for ordinary line-by-line code review.
---

# Fable review — independent cross-model challenge of a plan/diagnosis

A common failure mode in chemistry-tool development is a **confident-but-wrong premise** — a
diagnosis that reads as solid, is repeated across sessions, and turns out wrong on
re-derivation. Automated correctness gates — a round-trip/canonicalizer check, a regression
suite, an atom/mass-balance certificate — all verify *code*, not *reasoning*. This skill gets
an **independent review from a different model family before shipping**, aimed at the
diagnosis. The reviewer reads and reports; it does not implement. A different-family model
reviewing a diagnosis is fine; one working as a parallel implementer on the same files is not
(see your project's own rules on parallel work), because a fresh model has not read your
project-specific invariants.

## How to run

Spawn one reviewer via the Agent tool on a model family other than the session's: `fable` by
default, `opus` when the session itself runs on Fable. A same-family reviewer shares the
author's blind spots, and an alias for the session's own family resolves to the session's exact
model, so it would not be a second opinion.

```
Agent(
  subagent_type: "claude",   # catch-all agent type
  model: "fable",            # alias, follows the newest Fable; "opus" if the session is on Fable
  description: "Fable review of <plan>",
  prompt: <the review brief below, with the doc path(s) filled in>,
)
```

Run it in the **background** (async) when the user wants to continue other work meanwhile; wait
for it when the plan is blocking a commit. One reviewer, not a fan-out — an oversized fan-out
of reviewers adds cost, not independence.

If your organization's model allowlist permits no version of the requested family, Claude Code
runs the reviewer on the session's own model and shows a warning; check the model named on the
reviewer's row in `/tasks` before counting the review as cross-model.

## The review brief (fill in the doc path)

> You are an adversarial reviewer on a different model family from the author. Your job is to
> refute, not to agree. Read `<DOC PATH>` (and any files/commits it cites). This is
> `<describe your chemistry tool, e.g. a deterministic structure→name namer, a property-prediction
> pipeline, a reaction-outcome predictor>`; the dominant failure mode here is a confident-but-wrong
> premise that passes every gate because gates verify code, not reasoning.
>
> Read your project's fix-methodology / engineering-log doc for its standing invariants — at
> minimum: spy-before-you-code, verify-your-harness-actually-ran, VERIFIED-vs-ASSUMED tagging on
> load-bearing claims, rank-by-sole-blocker (not touched-count), and any bounded-goal
> satisfiability rule. For every load-bearing claim in the plan, not only the first few:
> 1. Is it tagged VERIFIED (with a command/citation-incl-section-heading) or ASSUMED? An ASSUMED
>    claim may not justify deleting a guard or sizing a fix.
> 2. Could the measurement be right but the diagnosis wrong? Name a concrete alternative cause.
> 3. Is any reachability/yield/size number derived from static inspection or a warm-cache/batch
>    run rather than a fresh-process measurement over the target rows?
> 4. Does any proposed fix touch a correctness-sensitive path without a full-gate/regression plan,
>    or pair a coverage floor with a byte-identity/total-proof requirement (a classic unsatisfiable-
>    goal trap — see the `bounded-goals` skill)?
> 5. Is a "central decision point" named as the fix site without a spy proving it is on the path?
>
> Output: a numbered list of every concrete refutation or gap you find, each tagged [BLOCKER] /
> [RISK] / [NIT], each with the exact check that would settle it; the tags carry severity, so
> report low-confidence gaps too. If you find nothing, say so and name the single claim you are
> least able to verify. Return only this list: leave the plan unrestated and the code unchanged.

## After the review

The reviewer reports everything it finds; the filtering is yours. Check each finding against
the evidence before acting on it: accept it or refute it with a result, rather than agreeing
by default or implementing it unexamined. A [BLOCKER] must be resolved (or explicitly refuted
with evidence) before the plan ships. Record durable outcomes in the finding doc.
