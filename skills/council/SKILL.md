---
name: council
description: Answers a strategy or judgment-call question by re-deriving its load-bearing numbers first, then weighing the options through three or more distinct expert voices, then making one call with the condition that would flip it. Use when the user asks a strategy, prioritization, or judgment-call question — which option, what to work on next, is X worth it, should we do A or B, your call, show me the options, what's the best move, is this the right approach — or any decision that rests on a number, estimate, or recommendation that would otherwise be taken on trust. Not for ranking an eval run's failure classes (use cluster-failures) or for a second opinion on a finished plan before it ships (use fable-review).
---

# Council

## Overview

A strategy question is not answered from what you already know. It is answered by
searching first, then convening a council of distinct expert voices, then making one call.

Core principle: **every load-bearing number or claim — in the question, the handoff,
memory, or a planning note — is a hypothesis until you re-derive it from ground truth
this turn.** A single well-reasoned voice is exactly how a false premise ships. The
council exists so that one voice attacks another before the answer reaches the user.

Why this is a hard rule: "concentrated ROI" pools in chemistry projects routinely
over-count 15–50× (e.g. a curated list of "~100 candidate defects" that turns out to
have 2 genuine instances on re-derivation; "124 flagged structures" that turns out to be
~6 genuine). A baseline test of this exact skill's absence: three capable agents given one
strategy question produced three different recommendations, one built entirely on an
unvalidated number. Search + council makes the answer convergent instead of a coin-flip.

## The protocol (do these in order)

### 1. Search before you weigh — validate the premise

- Extract every load-bearing claim from the question and from your loaded context
  (handoff, memory, planning notes). Treat each as a claim to test, not a fact.
- Give each independent facet its own investigator, run in parallel (parallel `Agent`
  calls); check a facet you can settle in a handful of tool calls inline. The
  standard three facets for a "should we do X?" question:
  1. **Validate the headline number** for X (re-derive the reachable win from ground truth).
  2. **Size the alternative** (what does the road-not-taken actually offer?).
  3. **Assess X's risk** (blast radius, determinism/regression surface, effort).
- In your project, ground truth = your evaluation corpus/benchmark results, your run
  ledger, and the pipeline probed directly (any shortcuts/caches off, reproduce-first),
  not the tag/heuristic count in a note.

### 2. Convene the council — at least three named voices

After the evidence is in, give the decision three or more distinct voices, each
reasoning only from the evidence just gathered, each free to disagree:

- 🛠️ **Senior Engineer** — feasibility, blast radius, determinism/regression risk, effort,
  root-cause vs band-aid, does it fit the codebase's grain.
- 📊 **Product Manager** — reachable wins, ROI, milestone fit, opportunity cost, what
  actually moves the metric the user cares about.
- 🔬 **Skeptic / QA** — attacks the premise and the numbers, names what is still unverified,
  hunts the hidden coupling and the failure mode nobody priced in.
- ➕ Add a **domain expert** or **user-advocate** voice when the decision turns on one.

Each voice is 1–3 sentences with its own read and may reach a different conclusion.
Surface real disagreement rather than manufacturing consensus.

### 3. The chair synthesizes — the answer the user reads

Always use this order, leading with the call:

1. **The call** — one option, stated first, unmissable.
2. **Confidence** + the single biggest remaining uncertainty.
3. **All options side by side** — a compact table (reachable wins / risk / effort). They
   asked to see the options; show them.
4. **What would flip the call** — the one observation that would change the answer.

The search and the council voices follow the call, as its support.

## Scale to the stakes

| Decision | Search | Council |
|---|---|---|
| Small / easily reversible | inline parallel probes | brief 3-voice, terse |
| Milestone / expensive / hard to reverse | one parallel investigator per facet | 3–4 voices, explicit disagreement |

## Rules

- **A number you did not re-derive this turn is not evidence — it is a claim to test.**
- **No council of yes-men.** If every voice agrees instantly, you under-searched or you are
  steering to the expected answer. Add the skeptic's strongest counter and check it.
- **Make the call.** "It depends" / "both are fine" is not an answer. State the call and the
  condition that would change it.

## Rationalizations — stop if you catch one

| Excuse | Reality |
|---|---|
| "I probed a couple examples, that's enough." | Confirming a class "fails closed" ≠ counting the reachable win. Size the whole pool. |
| "They're clearly leaning toward X." | Steering to the expected answer defeats the point. Weigh the evidence, then be willing to tell them they're wrong. |

## Worked examples (illustrative)

**Q:** "Fix the low-confidence-prediction cluster, or ship the pending featurizer
refactor — your call?" The handoff said the cluster = "~100 rows, one root cause."
**Call:** ship the featurizer refactor first, targeting its low-risk sub-fix.
**Confidence:** high; biggest uncertainty: whether the cluster gates a future model family.

| Option | Reachable wins | Risk | Effort |
|---|---|---|---|
| Featurizer sub-fix | ~45 | low | smaller |
| Cluster fix | 2 | moderate+ (determinism) | larger |

**Flips if:** the cluster turns out to gate a future model family — then build the contained half only.
**Search (3 parallel investigators):** a corpus scan finds **2** genuine reachable wins from
a targeted cluster fix (most tagged rows are out-of-domain scaffolds the model was never
trained on); the ledger shows **~45 low-risk wins** from the featurizer refactor's smaller
sub-fix; a code trace shows the cluster fix un-masks a determinism defect in a shared
normalization step (moderate+ risk).
**Council:** 🛠️ "2 wins behind a determinism-sensitive guard is a bad trade." 📊 "2 vs ~45
reachable — not close." 🔬 "The ~100 was another over-counted pool."

**Q (small, reversible):** "Batch size 32 or 64 for tonight's retrain?" **Call:** 64.
**Confidence:** medium; the run ledger shows both prior runs at 64 converged. **Options:** 32
(slower) / 64 (half the wall-clock). **Flips if:** out-of-memory at 64. **Council:** 🛠️ "Fits
in memory." 📊 "Halves the wall-clock." 🔬 "Only two prior runs."
