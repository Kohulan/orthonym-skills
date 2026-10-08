---
description: Changing an existing expected value belongs to change-asserted-value, not test-gate.
tags: [test-gate, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

In tests/test_names.py the assertion expects 'propan-2-ol', but after my refactor the namer returns '2-propanol'. Change the expected string to match.
