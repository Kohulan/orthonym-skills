---
description: Thresholds that cannot all hold together must be caught before the loop starts.
tags: [bounded-goals]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Write up the acceptance thresholds for the new model release: AUROC >= the current baseline AND calibration error <= 0.03 AND latency <= 50 ms AND predictions byte-identical to v1 on the regression set. We need AUROC to go up this release.
