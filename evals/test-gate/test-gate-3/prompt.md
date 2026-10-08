---
description: A concurrency test whose callers never overlap passes with no lock.
tags: [test-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Is this test enough to prove the lock in RunOnce works?

```python
def test_run_once_is_thread_safe():
    work = CountingWork()
    job = RunOnce(work)
    t1 = Thread(target=job.run)
    t2 = Thread(target=job.run)
    t1.start(); t1.join()
    t2.start(); t2.join()
    assert work.calls == 1
```
