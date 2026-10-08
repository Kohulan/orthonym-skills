---
description: A bug fix with two defensible repairs must table the current behaviour and leave the choice to the user.
tags: [understand-before-merge]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Fix this bug. Our nightly descriptor job crashes on one bad row and writes nothing:

```python
def compute_descriptors(rows):
    out = []
    for row in rows:
        mol = Chem.MolFromSmiles(row["smiles"])
        out.append({"id": row["id"], "mw": Descriptors.MolWt(mol), "logp": Crippen.MolLogP(mol)})
    return out
```

The traceback ends in `ArgumentError: Python argument types in MolWt(NoneType) did not match C++ signature` for row id 4411, whose SMILES is `C1CC(`. The output goes to a parquet file that a dashboard reads. There is no repo in this session; answer in your reply.
