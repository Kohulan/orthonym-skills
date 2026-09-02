---
name: run-eval
description: Use whenever the question is "did that change help", "what is our accuracy now", or "run the eval/benchmark" — and before and after any fix to a chemistry model or pipeline. Triggers on quoting an accuracy number with no run id, on a hand-rolled measurement loop in a scratchpad, on a single headline rate quoted alone, and on any request to measure against a held-out split.
---

# Run the evaluation

Your eval harness (`<your-eval-command>`) is the one committed way to get an accuracy
number. Do not hand-roll a measurement loop in a scratchpad — ad-hoc harnesses produce
numbers that are not comparable across sessions, and can be wrong by a large factor
without anyone noticing (a several-fold mirage has actually happened from an ad-hoc
script).

## Wire this up

Substitute for your project:
- `<your-eval-command> --split <split>` — the committed eval entrypoint (a script that
  runs your model/pipeline over a named split and writes a run record)
- the split table below — replace names/sizes with your project's actual splits
- the metrics list — replace with your project's headline + supporting metrics
- `<runs-directory>` — wherever run records persist

## The command

```bash
<your-project-python> <your-eval-command> --split <dev-split>
```

Use your project's real interpreter (a pinned venv/uv environment, not a bare system
`python`, if your project pins dependencies that way).

| split | n | wall clock | when |
|---|---|---|---|
| `<dev-split>` | (small) | short | the loop. Default. |
| `<pre-commit-split>` | (medium) | longer | before committing a change |
| `<holdout-split>` | (held out) | longer | **only when the user explicitly asks** |

A held-out split should refuse to run without an explicit "I mean it" flag or similar
guard. Do not pass that flag on your own initiative. It exists so at least one number
at the end of the project has never been optimised against; spending it early on
routine iteration cannot be undone.

## Read multiple numbers, not one

A single accuracy figure cannot tell "we fixed a wrong output" from "we stopped
producing one". Read at least a headline correctness metric **plus** an emit/coverage
rate and a precision-on-emitted (or precision-on-produced) rate together, e.g.:

```
headline_correct_rate     38.2%   191/500   <- HEADLINE
emit_rate                 39.8%   199/500
precision_on_emitted      96.0%
```

Concretely, in a naming engine: turning off validity gates moved emissions 199 → 441
while the headline round-trip-exact rate stayed at **exactly 191**, and precision on
what was emitted fell 96.0% → 43.3%. Loosening a gate bought raw coverage, not
correctness — a single rate would have hidden that. If your emit/coverage rate rose
and your precision fell, the change bought coverage with less honesty; say so
explicitly rather than reporting the coverage number alone. The same discipline applies
to any chemistry task: a property predictor that widens its confidence band to cover
more compounds, or a retrosynthesis model that proposes more candidate routes per
target, needs the same two-number check.

**Never quote a cheap proxy metric as the result** — string/token similarity (BLEU,
token accuracy, edit distance) against a reference label, or any metric computed
against noisy/self-inconsistent reference data. If the harness computes them, print
them labelled clearly as secondary/diagnostic, never as the headline. Measured case:
on one split, a proxy metric *fell* between two runs whose true correctness metric
(reference-free round-trip validity) was identical — the proxy tracked emission volume,
not correctness, because the reference labels it compared against were only ~82%
self-consistent.

**Prefer a reference-free validation whenever one exists.** For structure↔name work
that means: round-trip the output through a parser/canonicalizer (e.g. parse the
generated name back to a structure, canonicalize both the input and the round-tripped
structure — RDKit → canonical InChIKey — and compare) rather than comparing strings to
a reference name. The same pattern generalizes elsewhere: round-trip a predicted SMILES
through a canonicalizer and compare it to the input; check a predicted reaction's mass
balance; verify a docked pose against a physical/geometric constraint. Reference-free
checks catch errors that string-similarity to a noisy reference label cannot.

## Two configurations, and why you need both

```bash
<your-eval-command> --split <dev-split>                 # shipped: the headline
<your-eval-command> --split <dev-split> --gates off     # diagnostic: the causes
```

If your pipeline has validity/self-consistency gates that turn a bad output into an
abstention, run both: the shipped config is the honest number to report, but it
collapses every cause into one "abstained" bucket. The gates-off (or otherwise
unfiltered) run surfaces the underlying failure reasons (e.g. `parse_fail` vs
`constitution_mismatch`) so you can cluster and diagnose them separately. If the
headline metric is identical in both configs, this costs nothing extra in headline
terms — cluster the gates-off run, report the shipped one.

## Before you run

- **You may run alongside other measurement or gate work**, provided nothing writes to
  the same output artifact concurrently. If your eval spawns concurrent worker
  processes that contend over a shared external resource (a license, a GPU, an
  external validator subprocess/interpreter), use an explicit budgeting mechanism
  (a semaphore/lock that is provably released even if a worker is killed) rather than
  assuming exclusivity or checking with `pgrep` — `pgrep` self-matches and cannot tell
  you how many slots are actually free.
- Check what your run's logs look like at scale before relying on grep-based
  filtering. Verbose per-row warnings can make a large run's output unreadable; filter
  them (e.g. `2>&1 | grep -v "WARNING:"`) rather than losing signal in noise.

## Output

Every run should persist to `<runs-directory>/<timestamp-or-id>.json` (or similar)
with, at minimum: the commit SHA, **whether the working tree was dirty**, the split's
content hash, and the resolved configuration (which gates/flags were active). Cite the
run id whenever you quote a number. Without that provenance a number is not
interpretable — a config knob can move the emit/coverage rate by tens of points, and a
record that keeps only a timestamp can't tell two configurations apart after the fact.

## Thresholds

Check a result against your project's committed goals/bounds file (a `goals.json` or
equivalent — see the `eval-loop` skill for how to structure one) rather than against
memory. That file should hold the current baselines and which bound is the headline.
