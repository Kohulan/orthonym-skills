---
description: A test for a fail-closed guard must also prove the healthy path gets through.
tags: [test-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

I fixed a bug where the lag check was ignored. Here is the guard now:

```python
def check_backend(health):
    """Refuse to start ingest when the backend is unhealthy."""
    if health.status != "ok" or health.lag_s > 30:
        raise BackendUnhealthy(health)
```

Add a pytest test for this fix. Reply with the test code.
