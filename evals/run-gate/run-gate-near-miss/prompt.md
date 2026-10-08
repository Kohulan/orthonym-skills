---
description: Measuring accuracy on an eval split is run-eval, not run-gate.
tags: [run-gate, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

What's our accuracy on the test split now? The eval command is `python scripts/eval.py --split test`; the last run, two weeks ago, said top-1 0.861.
