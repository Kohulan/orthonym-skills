---
description: Tests whose mock holds the answer, or that loop over empty output, cannot fail.
tags: [test-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Review these two tests from a PR. Are they enough?

```python
def test_get_uses_cache():
    backend = Mock(return_value={"id": 7, "name": "cached"})
    cache = Cache(backend)
    assert cache.get(7) == {"id": 7, "name": "cached"}

def test_spans_valid():
    for span in find_spans(""):
        assert span.start < span.end
```
