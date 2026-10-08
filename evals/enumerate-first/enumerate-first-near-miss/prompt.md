---
description: A bug that already has a reproduction does not need enumerate-first.
tags: [enumerate-first, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Here's a SMILES that reproduces the crash: `C1CC2CCC1C2`. The ring parser raises IndexError on it. Find and fix the bug. (No code in this session; tell me how you'd approach it.)
