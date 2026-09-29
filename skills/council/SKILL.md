---
name: council
description: Answers a strategy or judgment-call question by re-deriving its load-bearing numbers first, then weighing the options through three or more distinct expert voices, then making one call with the condition that would flip it. Use when the user asks a strategy, prioritization, or judgment-call question — which option, what to work on next, is X worth it, should we do A or B, your call, show me the options, what's the best move, is this the right approach — or any decision that rests on a number, estimate, or recommendation that would otherwise be taken on trust. Not for ranking an eval run's failure classes (use cluster-failures) or for a second opinion on a finished plan before it ships (use fable-review).
---

# Council

## Overview

A strategy question is not answered from what you already know. It is answered by
**searching first, then convening a council of distinct expert voices, then making one call.**

Core principle: **every load-bearing number or claim — in the question, the handoff,
memory, or a planning note — is a hypothesis until you re-derive it from ground truth
this turn.** A single well-reasoned voice is exactly how a false premise ships. The
council exists so that one voice attacks another before the answer reaches the user.

Why this is a hard rule: "concentrated ROI" pools in chemistry projects routinely
over-count **15–50×** (e.g. a curated list of "~100 candidate defects" that turns out to
have 2 genuine instances on re-derivation; "124 flagged structures" that turns out to be
~6 genuine). A baseline test of this exact skill's absence: three capable agents given one
strategy question produced three different recommendations, one built entirely on an
unvalidated number. Search + council makes the answer convergent instead of a coin-flip.

## The protocol (do these in order)

### 1. Search before you weigh — validate the premise

- Extract every load-bearing claim from the question **and** from your loaded context
  (handoff, memory, planning notes). Treat each as a claim to test, not a fact.
- Fan out **parallel investigators** — a `Workflow`, or parallel `Agent` calls — one per
  independent facet. The standard three facets for a "should we do X?" question:
  1. **Validate the headline number** for X (re-derive the reachable win from ground truth).
  2. **Size the alternative** (what does the road-not-taken actually offer?).
  3. **Assess X's risk** (blast radius, determinism/regression surface, effort).
- In your project, ground truth = your evaluation corpus/benchmark results, your run
  ledger, and **the pipeline probed directly** (any shortcuts/caches off, reproduce-first),
  **not** the tag/heuristic count in a note.

### 2. Convene the council — at least three named voices

After the evidence is in, give the decision **three or more distinct voices**, each
reasoning **only from the evidence just gathered**, each free to disagree:

- 🛠️ **Senior Engineer** — feasibility, blast radius, determinism/regression risk, effort,
  root-cause vs band-aid, does it fit the codebase's grain.
- 📊 **Product Manager** — reachable wins, ROI, milestone fit, opportunity cost, what
  actually moves the metric the user cares about.
- 🔬 **Skeptic / QA** — attacks the premise and the numbers, names what is still unverified,
  hunts the hidden coupling and the failure mode nobody priced in.
- ➕ Add a **domain expert** or **user-advocate** voice when the decision turns on one.

Each voice is 1–3 sentences with its own read and may reach a different conclusion.
**Surface real disagreement — never manufacture consensus.**

### 3. The chair synthesizes — the answer the user reads

Produce, in this order, leading with the verdict:

1. **The call** — one option, stated first, unmissable.
2. **Confidence** + the single biggest remaining uncertainty.
3. **All options side by side** — a compact table (reachable wins / risk / effort). They
   asked to see the options; show them.
4. **What would flip the call** — the one observation that would change the answer.

The council voices and the search sit above the call as support; the verdict is not buried.

## Scale to the stakes

| Decision | Search | Council |
|---|---|---|
| Small / easily reversible | inline parallel probes | brief 3-voice, terse |
| Milestone / expensive / hard to reverse | full `Workflow` fan-out | 3–4 voices, explicit disagreement |

## Rules

- **A number you did not re-derive this turn is not evidence — it is a claim to test.**
- **No council of yes-men.** If every voice agrees instantly, you under-searched or you are
  steering to the expected answer. Add the skeptic's strongest counter and check it.
- **Make the call.** "It depends" / "both are fine" is not an answer. State the call and the
  condition that would change it.

## Rationalizations — STOP if you catch one

| Excuse | Reality |
|---|---|
| "The handoff/memory already gives the number." | Loaded numbers are hypotheses. Reproduce-first exists *because* they over-count 15–50×. Re-derive it this turn. |
| "I probed a couple examples, that's enough." | Confirming a class "fails closed" ≠ counting the reachable win. Size the whole pool. |
| "One well-reasoned answer is cleaner than a council." | A single lens is how a false premise ships. The council makes one voice attack the others. |
| "They're clearly leaning toward X." | Steering to the expected answer defeats the point. Weigh the evidence, then be willing to tell them they're wrong. |
| "It depends / both are viable." | Non-answer. Make the call, then state what would flip it. |

## Red flags — you are about to fail

- Weighing options using a number from a note/memory you have not re-derived this turn.
- Your recommendation has exactly one voice.
- Every voice agrees and you never looked for the counter-argument.
- Your answer is "it depends" with no call and no flip-condition.

## Worked example (illustrative)

**Q:** "Fix the low-confidence-prediction cluster, or ship the pending featurizer
refactor — your call?" The handoff said the cluster = "~100 rows, one root cause."
**Search (3 parallel investigators):** corpus scan → genuine reachable wins from a
targeted cluster fix = **2** (most tagged rows are out-of-domain scaffolds the model was
never trained on); ledger → the featurizer refactor's smaller sub-fix = **~45 low-risk
wins**; code trace → the cluster fix un-masks a determinism defect in a shared
normalization step (moderate+ risk).
**Council:** 🛠️ "2 wins behind a determinism-sensitive guard is a bad trade." 📊 "2 vs ~45
reachable — not close." 🔬 "The ~100 was another over-counted pool." **Call:** ship the
featurizer refactor first, targeting its low-risk sub-fix. **Flips if:** the cluster turns
out to gate a future model family — then build the contained half only.
