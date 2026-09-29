---
name: fable-review
description: Gets one adversarial review of a load-bearing plan, diagnosis, or finding from a reviewer on a different model family (fable by default), told to refute its premise. Use when a plan, diagnosis, or finding is about to ship and its premise, if wrong, would waste the next iteration. Triggers on "fable-review", "review the plan with fable", "get a second opinion", a diagnosis about to size or scope a build, and any claim repeated across sessions without being re-derived. Not for ordinary line-by-line code review.
---

# Fable review — independent cross-model challenge of a plan/diagnosis

A common failure mode in chemistry-tool development is a **confident-but-wrong premise** — a
diagnosis that reads as solid, is repeated across sessions, and turns out wrong on
re-derivation (this recurs often enough in practice that it deserves a standing check).
Automated correctness gates — a round-trip/canonicalizer check, a regression suite, an
atom/mass-balance certificate — all verify *code*, not *reasoning*. This skill borrows the one
useful idea from the fable-advisor architect pattern — an **independent, different-model review
before shipping** — and scopes it to challenging the DIAGNOSIS, which is where complex projects
bleed. It does NOT delegate implementation: a non-Claude model reviewing a diagnosis is fine; a
non-Claude model as a parallel implementer touching the same files is not (see your project's own
rules on parallel work, and never trust a fresh model to carry project-specific invariants it
hasn't read).

## How to run

Spawn ONE reviewer on **Fable** via the Agent tool (Fable is a different model family from Opus →
catches blind spots a same-family reviewer shares):

```
Agent(
  subagent_type: "claude",   # catch-all agent type
  model: "fable",            # Fable 5 — the cross-model reviewer
  description: "Fable review of <plan>",
  prompt: <the review brief below, with the doc path(s) filled in>,
)
```

Run it in the **background** (async) when the user wants to continue other work meanwhile; wait
for it when the plan is blocking a commit. One reviewer, not a fan-out — an oversized fan-out
of reviewers adds cost, not independence.

## The review brief (fill in the doc path)

> You are an adversarial reviewer on Fable, a DIFFERENT model family from the author (Opus). Your
> job is to REFUTE, not to agree. Read `<DOC PATH>` (and any files/commits it cites). This is
> `<describe your chemistry tool, e.g. a deterministic structure→name namer, a property-prediction
> pipeline, a reaction-outcome predictor>`; the dominant failure mode here is a confident-but-wrong
> PREMISE that passes every gate because gates verify code, not reasoning.
>
> Read your project's fix-methodology / engineering-log doc for its standing invariants — at
> minimum: spy-before-you-code, verify-your-harness-actually-ran, VERIFIED-vs-ASSUMED tagging on
> load-bearing claims, rank-by-sole-blocker (not touched-count), and any bounded-goal
> satisfiability rule. For EACH load-bearing claim in the plan:
> 1. Is it tagged VERIFIED (with a command/citation-incl-section-heading) or ASSUMED? An ASSUMED
>    claim may not justify deleting a guard or sizing a fix.
> 2. Could the measurement be right but the DIAGNOSIS wrong? Name a concrete alternative cause.
> 3. Is any reachability/yield/size number derived from static inspection or a warm-cache/batch
>    run rather than a fresh-process measurement over the target rows?
> 4. Does any proposed fix touch a correctness-sensitive path without a full-gate/regression plan,
>    or pair a coverage floor with a byte-identity/total-proof requirement (a classic unsatisfiable-
>    goal trap — see the `bounded-goals` skill)?
> 5. Is a "central decision point" named as the fix site without a spy proving it is ON the path?
>
> Output: a numbered list of CONCRETE refutations or gaps, each tagged [BLOCKER] / [RISK] /
> [NIT], each with the exact check that would settle it. If you find nothing, say so and name the
> single claim you are least able to verify. Do NOT restate the plan. Do NOT rewrite code.

## After the review

Treat findings the way good code review should be received — verify each with rigour, don't
performatively agree, don't blindly implement. A [BLOCKER] must be resolved (or explicitly
refuted with evidence) before the plan ships. Record durable outcomes in the finding doc.
