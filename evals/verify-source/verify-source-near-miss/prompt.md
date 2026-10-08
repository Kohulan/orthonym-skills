---
description: Reading a function is ordinary code reading, not verify-source.
tags: [verify-source, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

What does this function do?

```python
def parse_ring_closure(tok, open_rings):
    n = int(tok[-1])
    if n in open_rings:
        return ('close', open_rings.pop(n))
    open_rings[n] = len(open_rings)
    return ('open', n)
```
