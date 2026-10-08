---
description: A three-iteration accuracy push must work one cluster per iteration and revert hard-bound regressions.
tags: [eval-loop]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Our name-to-structure tool's exact-match rate is stuck at 71.0% on the dev split (run id 2026-10-01-a). Our goals.json has two hard bounds: protected-set pass count >= 640 and precision-on-emitted >= 95%. Work the loop for three iterations. There is no repo in this session: lay out exactly what you will do in each iteration and in what order, then stop.
