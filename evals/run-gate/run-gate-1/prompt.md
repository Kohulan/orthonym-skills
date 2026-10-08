---
description: Shipping a phase runs the full gate by the recipe - commit, background launch, verdict file, fields.
tags: [run-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Phase 4 is done, run the gate. Our gate is `scripts/gate.sh` (about 2 hours; it writes out/verdict.json at the end and logs to out/gate.log). My change to src/rings.py is not committed yet. (No shell in this session: tell me the exact sequence you will follow, then stop.)
