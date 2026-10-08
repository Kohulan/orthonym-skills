---
description: A "quick 500-row sanity run" on a question with a full-split answer is treated as a rerun.
tags: [reuse-before-rerun]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Do a quick 500-row sanity run on the stereo split to check we're still at 91%. Last full stereo run (ledger row, 2026-09-12, HEAD 9f1c2ab): 8,400 rows, top-1 0.912. Since then one fix shipped, "fix(stereo): ring-closure parity", measured at +0.4 points on its 300 affected rows. (No shell in this session: tell me what you will do and why, then stop.)
