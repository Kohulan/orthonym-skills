# Fix Methodology: Root Cause Only

## Rule
When output is wrong, fix the data or logic that PRODUCES it. Never add
string postprocessors, regex normalizers, or format converters to mask bugs.

## Decision Checklist

Before proposing any fix, answer:
1. WHERE does the wrong value originate? (trace the call chain)
2. Is this a DATA bug (wrong lookup table), LOGIC bug (wrong algorithm), or
   ASSEMBLY bug (wrong string building)?
3. Can I fix it at source so the output is correct WITHOUT postprocessing?

If the answer to #3 is yes (it almost always is): fix at source.

## Red Flags in Plans

Reject any plan that proposes:
- `re.sub()` or `str.replace()` to fix a generated output (a name, a label, a formatted score)
- A `_postprocess_result()` function or similar
- `@pytest.mark.xfail` for "unfixable" output bugs
- Growing lists of special-case transformations keyed on the specific input that triggered
  the bug

These are symptoms of unfixed root causes.

## Debugging Example: Trace to the Producing Stage

Print the intermediate value the wrong stage computed, not the final rendered output. For a
ring/heteroatom-indexing bug:
```python
from rdkit import Chem
from yourpkg.perception import match_ring_system   # your perception function

mol = Chem.MolFromSmiles("<SMILES>")
_, atom_mapping, _ = match_ring_system(mol)
for atom_idx, label in atom_mapping.items():
    atom = mol.GetAtomWithIdx(atom_idx)
    print(f"  {atom.GetSymbol()} (atom {atom_idx}) -> {label}")
```
If an atom is mapped to the wrong label, fix the lookup table or rule that *produced* the
mapping — never patch the string that gets printed downstream from it.

## Example: root cause vs band-aid

- **Band-aid (wrong):** regex to rewrite one wrong output string into the right one after the
  fact (e.g. `"...2,4-dione"` → `"...1,3-dione"`)
- **Root cause (right):** one-line fix to the lookup table the perception step reads from
- **Result:** fixes ALL affected outputs (not just the one observed), lets you delete the
  postprocessor entirely, and often resolves other "unfixable" cases for free
