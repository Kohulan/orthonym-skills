---
description: Undifferentiated abstentions must be attributed per row to sites and ranked by sole blocker.
tags: [refusal-census]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

All 412 failing rows in last night's dev run (commit a1b2c3d, 2,000 rows) say `tier=T5, source=abstain, reason=UNNAMEABLE`. Why did we abstain on these? A sample of the per-row WARNING log:

```
row 17  WARNING ring_handler: REFUSE RING_NO_HANDLER (spiro)
row 17  WARNING locant: REFUSE LOCANT_TIE
row 17  WARNING locant: REFUSE LOCANT_TIE
row 18  WARNING fg_rules: REFUSE FG_NO_RULE
row 19  WARNING ring_handler: REFUSE RING_NO_HANDLER
row 19  WARNING fg_rules: REFUSE FG_NO_RULE
```

There is no repo in this session: tell me step by step how you will find out, then stop.
