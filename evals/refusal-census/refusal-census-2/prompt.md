---
description: Build order must follow the sole-blocker ranking and say how many inputs the fix flips.
tags: [refusal-census]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Which site is blocking the most inputs? I want to know what to build next to raise coverage. Census of 412 failing rows (dev split, tier T5, commit a1b2c3d), sites deduplicated per input:

| site | sole blocker | first refusal | touched |
|---|---|---|---|
| RING_NO_HANDLER | 31 | 227 | 280 |
| LOCANT_TIE | 58 | 70 | 120 |
| FG_NO_RULE | 12 | 101 | 264 |

Mean sites per failing input: 3.4 (median 4). Which should we build first, and how many inputs will it flip?
