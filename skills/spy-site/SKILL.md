---
name: spy-site
description: Prove a code site is actually on the execution path before editing it. Use BEFORE any fix that names a function, method, or module as "the place to change" — and whenever a plan, roadmap, or audit doc points at a central decision point. Refuses the site if it records zero calls for the target molecules.
---

# Spy the site before you code

**A documented "central decision point" is often off the execution path until a spy says
otherwise.** In one project's history this was 5-for-5: every site named in a plan as the
place to fix was called **zero** times for the outputs it was meant to fix:

| Site | Named in | Reality |
|---|---|---|
| `should_skip_locant()` (a formatting helper) | a roadmap phase plan | 0 calls |
| `_assemble_fragments()` | a hand-off doc | 0 calls |
| `_build_output_string()` + its sibling helper | a task brief | 0 calls — the live join was a *third inline copy* |
| `ranking/candidate_pool.py` scoring cascade | a code review | hundreds of selections, pool size 1 every time, the tie-break function 0 calls |

The cost of skipping this is a whole task spent editing code that never runs.

## The procedure

**1. Name the site and the target rows.** A spy without a target row set proves nothing —
"is it called at all" is a different question from "is it called for the molecules I am
trying to fix".

**2. Monkeypatch a counter.** In a worker subprocess so the production import path is
unchanged:

```python
import yourpkg.ranking.candidate_pool as cp
calls = {'n': 0}
_orig = cp.CandidatePool.best
def spy(self, *a, **k):
    calls['n'] += 1
    return _orig(self, *a, **k)
cp.CandidatePool.best = spy
```

**3. Validate the spy against ≥2 known positives.** Not one. A trivially simple input (e.g. the
smallest molecule your pipeline handles) can record zero calls to a helper meant to be
universal, so a single positive can be silently wrong — you cannot tell "the site is off the
path" from "my spy is broken" with one data point. If neither positive registers, the spy is
broken; fix the spy before believing any zero.

**4. Assert the counter is non-zero before believing any number derived from it.** A probe
calling a non-existent method "succeeds" by never running (invariant 10). A `-k` selector
matching no test exits 5 and looks like a pass.

**5. Run over the target rows and record the count.**

## Refusal conditions

Report **REFUTED** and stop if:

- the site records **0 calls** for the target rows — the fix cannot land there
- the spy did not register on **≥2** known positives — the spy is untrustworthy
- the site is reached but the value it computes is discarded downstream (check what the
  caller does with the return, not just that the call happened)

On REFUTED: **record the refutation in the task brief or `eval/LOG.md`**, then locate the real
site by measurement. Only a *guess* about where the code is — never a measured refutation — is
grounds to stop the task.

## Finding the real site after a refutation

The live code is often an inline copy rather than the named helper. Grep for the *string
pattern the output has*, not for the function you expected to produce it. In one real case the
live join was a third inline copy of a loop duplicated inside an unrelated formatting function.

## Related

- `check-target` — validates that the *defect class* is real, before you spy its site.
- Your project's fix-methodology / engineering-log doc, if it has standing invariants for
  spy-before-code, verify-your-harness-ran, and never-size-a-defect-from-static-inspection.
