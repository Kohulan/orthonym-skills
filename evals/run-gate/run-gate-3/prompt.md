---
description: A PASS verdict is reconciled field by field against HEAD and the real current baseline.
tags: [run-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

The gate exited 0, can we ship? Here is out/verdict.json:

{"verdict": "PASS", "commit": "4f2a9c1", "protected_pass": 1198, "baseline": 1180, "new_regressions": 0, "new_nondeterminism": 0}

Current HEAD is 7b31e05. The last ship, three days ago, recorded protected_pass 1204.
