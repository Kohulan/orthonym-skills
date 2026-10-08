---
description: Writing a new regression test belongs to test-gate, not change-asserted-value.
tags: [change-asserted-value, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Add a regression test for my ring-closure fix: `split_tokens('C1CC1')` used to return ['C1CC1'] and now returns ['C1', 'C', 'C1']. The function lives in tokenizer.py.
