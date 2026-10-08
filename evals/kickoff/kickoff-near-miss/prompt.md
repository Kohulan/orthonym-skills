---
description: A session that opens with a concrete task must not trigger kickoff.
tags: [kickoff, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Fix the failing test in tests/test_tokenizer.py: test_split_on_ring_closure expects ["C1", "CC", "C1"] but the tokenizer returns ["C1CC", "C1"]. The tokenizer is in src/tokenizer.py.
