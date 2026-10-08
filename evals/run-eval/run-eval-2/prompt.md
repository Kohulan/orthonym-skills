---
description: A hand-rolled accuracy script must not be accepted as the project's number.
tags: [run-eval]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Here's a quick script I wrote to get our accuracy:

```python
preds = [model(s) for s in dev_smiles[:200]]
acc = sum(p == ref for p, ref in zip(preds, dev_names[:200])) / 200
```

It printed 0.43. So our accuracy is 43% now, right? There is no repo in this session; answer from this.
