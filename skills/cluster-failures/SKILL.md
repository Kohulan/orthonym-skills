---
name: cluster-failures
description: Ranks the failures of an eval or benchmark run by a structural feature of the input (ring system, charge state, stereocenter count, size, functional group) to set the build order. Use when an eval or benchmark run has finished, when the question is "what should I work on", "where are we losing", or "what is the biggest failure class", and before scoping any accuracy work. Triggers on failures bucketed by what the output looked like rather than by a structural feature of the input molecule. Analysis only — it never licenses a per-molecule special case or a string rewrite on the output. Not for attributing abstentions to the site that blocked them (use refusal-census), for validating a target already named (use check-target), or for choosing between strategic options (use council).
---

# Cluster the failures

```bash
<your-eval-command> --split <split>                     # produce a run record first
<your-cluster-script>                                    # newest run
<your-cluster-script> --run <run_id> --json clusters.json
```

Wire this up: point `<your-cluster-script>` at whatever groups your run's failing rows by
a feature of the **input** (see below) — it does not need to be fancy, a groupby over a
handful of derived columns is enough.

## Analysis only — this is the load-bearing constraint

This skill tells you which capability of your tool is weakest. It does **not** license a
fix keyed to what it shows you.

Forbidden, no matter how well a cluster localises: per-molecule special cases, lookup
tables keyed on benchmark rows, regex or string rewrites on the emitted output, and any
change that makes a cluster pass without making the underlying model/rule/logic correct.
A fix must be a change to structure perception, a rule/model, or a renderer/decoder — the
same standard as your project's fix-methodology doc, which this skill does not supersede.

It is stated here, not left to memory, because a clustering tool is exactly the input that
makes row-specific fixes look attractive: agents under metric pressure have moved the number
by rewriting output strings.

## Cluster on the input, not the output

A categorizer that buckets on substrings of what your tool **produced** answers "what did
the output look like" — that cannot rank build order, because the same wrong output
arises from unrelated causes, and one cause produces unrelated outputs (a coverage bug
and a stereochemistry bug can both emit an output that is "10% too short"). Bucket on the
**input molecule** instead, which answers "which capability is missing."

Order features most-specific-first, so the true cause wins over a coincidental
co-occurrence (e.g. a fused-ring glycoside is a glycoside problem, because the glycoside
layer is what fails, not the fused-ring layer): scaffold/ring-system class (acyclic →
mono/bicyclic → fused polycyclic → spiro → bridged/von-Baeyer-type → many isolated rings)
→ charge state → stereocenter count → heavy-atom-count band → functional-group class →
any domain-specific composite feature (glycoside/cyclic-sugar, a particular reaction
class, a particular protein-family pocket, …). Naming is one example task this ladder
applies to as well as property prediction, reaction/retrosynthesis prediction, docking, or
generative design — the point is a feature of the input graph, never a substring of the
prediction.

If your project already has per-class cohort enumerators (scripts that pull out "all the
glycosides", "all the steroids", "all the charged species", etc.), extend those rather
than inventing a parallel taxonomy — consistency across tools matters more than any one
tool's elegance.

## Cluster the diagnostic (gates-off) run

If your pipeline has a validity/consistency gate that suppresses a wrong output before
its cause is visible (a common pattern: everything that would have failed loudly instead
collapses to `abstain` or one generic failure code), that gate destroys the information
this skill needs. Cluster a **gates-off** or diagnostic-mode run instead, so the actual
cause is visible (e.g. `parse_fail` vs `constitution_mismatch` vs `property_out_of_range`)
— then report the shipped (gated) run's headline number alongside it. Your primary
correctness metric should be identical either way if the gate only accepts/rejects rather
than repairs; if it isn't, that mismatch is itself a finding worth reporting.

## Structural tells

Reported separately from the feature clusters, because each points at one defect rather
than a capability area. Scope these to rows that actually **emitted** an output — an
abstention carries whatever fallback your pipeline uses there, which can trip a naive
"too short/too long" check on any large input without anything actually being wrong.

Worth checking for (adapt to your domain):
- a placeholder token or sentinel value reaching the final output (e.g. the literal word
  "unknown" or "substituent" spliced into an otherwise real name/value). Check whether
  your failure-detection function actually looks for it — a documented "cannot see it"
  gap is itself a finding.
- an **atom/feature-coverage** tell: what your pipeline's own validator reads back out of
  the output accounts for well under 100% of the input's heavy atoms/features — computed
  as a set/multiset intersection from data you likely already have in the run record, no
  extra parse needed. Prefer this over naive length/size proxies. One project's naive
  proxy (`len(output) / heavy_atom_count`) turned out **anti-correlated** with real
  coverage — an output that silently dropped several atoms scored *better* than one that
  captured all of them, because it measured verbosity, not correctness. If you build a
  coverage tell, sanity-check it on one known-correct and one known-wrong row before
  trusting the ranking it produces.

## Then

Pick the largest cluster, **one per iteration**, and hand it to your project's fix/eval
loop. Do not fix two clusters in one iteration — you lose the attribution that makes the
next decision, which is the whole point of measuring.

A cluster being large is not on its own a reason to work it: check whether it is large
because a capability is genuinely missing, or because a different, unrelated layer fails
on molecules that happen to share that feature. (Real example from a naming project: its
largest cluster by row count was fused-ring molecules — yet the tool actually named fused
parents *better* than two comparison baselines on a probe set. The cluster was inflated
by substituent- and locant-placement failures that happened to co-occur with fused rings,
not by a fused-ring-perception gap.) Read the actual failing examples before choosing what
to fix.
