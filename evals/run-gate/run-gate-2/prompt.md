---
description: Mid-iteration checks use the fast pre-gate, which is never enough to ship.
tags: [run-gate]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

I'm still iterating on the ring-perception fix. Make sure I haven't broken anything. Our gate is `scripts/gate.sh` (full run about 2 hours); `scripts/gate.sh --fast` checks only the protected set (about 4 minutes, no determinism check). (No shell in this session: tell me what you will run and why, then stop.)
