---
description: A decision point named by a code review must be shown to run before it is tuned.
tags: [spy-site]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Per the code review, `_choose_parent_chain()` in naming/parent.py is where ring-versus-chain parent selection is decided. Tune its scoring weights so fused ring systems win over chains; the 40 molecules that currently get the wrong parent are listed in eval/wrong_parent.csv. (The repository is not available in this session; tell me exactly what you will do first and why, then stop.)
