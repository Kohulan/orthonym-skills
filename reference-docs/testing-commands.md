# Testing & Validation Commands

**Purpose:** General patterns for testing and validating a chemistry tool. Replace the
placeholders (`<...>`) with your project's actual commands and paths.

---

## 1. Calling your tool

Use the ONE documented public entry point — check your package's `__init__.py`, README, or
API docs for the correct import path rather than guessing a plausible one. A wrong-but-
plausible import silently pulling in a stale or unrelated duplicate is worse than an import
error.

```python
from <your_package>.<module> import <public_function>

result = <public_function>("<input, e.g. a SMILES string>")
```

Note any non-default modes explicitly (e.g. a `style=` or `mode=` argument) and what the
default is, so a diagnosis doesn't silently test the wrong mode.

---

## 2. Running tests

Prefer targeted test runs over a full-suite invocation, especially if any part of the suite
shells out to an external process (a Java-based parser, a licensed toolkit, a GPU job, a
network call) that can hang or deadlock under a blanket runner. If your project documents such
a hazard, trust it over the instinct to "just run everything."

```bash
# Targeted: one file
pytest tests/<module>/test_<feature>.py -v

# Targeted: keyword match across the suite
pytest tests/ -k "<feature_name>" -v

# Targeted: single test function
pytest tests/<module>/test_<feature>.py::test_<case> -v
```

(Substitute your project's actual test runner if it isn't `pytest`.)

---

## 3. Reference-free round-trip validation

A cheap, reference-free correctness check for any structure-producing or structure-consuming
tool: round-trip the output through an independent parser/canonicalizer and compare it back to
the input.

```python
from rdkit import Chem

input_repr = "<input, e.g. a SMILES string>"
output = <your_function>(input_repr)          # e.g. a name, a template, a predicted structure
recovered_mol = <independent_parser>(output)   # parse the output back into a structure

orig_key = Chem.MolToInchiKey(Chem.MolFromSmiles(input_repr))
recovered_key = Chem.MolToInchiKey(recovered_mol)
print("round-trip match:", orig_key == recovered_key)
```

This proves the output is a VALID re-encoding of the input. It does **not** prove the output
is the *preferred* or canonical one among several valid encodings — that needs a curated
gold/reference set for your domain.

---

## 4. Benchmarking

Sample a fixed, versioned corpus rather than an ad hoc set of inputs, so runs stay comparable
across changes:

```bash
<your-benchmark-script> --split <named_split> --output <results_file>
<your-benchmark-script> --sample 50 --output <quick_results_file>   # fast smoke check
```

Keep splits immutable once created — regenerate only via a documented script, never by
hand-editing or re-sampling, or a "before vs. after" comparison stops being valid.

---

## 5. Diagnosing a single input

Build one small script that prints the tool's intermediate perception state (functional
groups found, rings detected, principal chain/scaffold, or whatever your pipeline's internal
representation is) alongside its final output, for one input at a time. This is almost always
faster than reading logs from a full benchmark run when chasing one specific wrong case.
