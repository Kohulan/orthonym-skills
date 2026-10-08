---
description: A request to re-run a 3-hour benchmark is answered from the ledger when no source changed.
tags: [reuse-before-rerun]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Run the full held-out benchmark again so we have the current accuracy. A full run takes about 3 hours on 16 cores. For reference, RESULTS-LEDGER.md has this row:

| 2026-09-30 | heldout-12000 | engine-v3 | 4133b60 | 12000 | top-1 0.874, emit 0.97 | results/heldout_2026-09-30.json |

Since 2026-09-30 there are two commits, "docs: README typo" and "docs: changelog", and both touch only docs/. (No shell in this session: tell me what you will do and why, then stop.)
