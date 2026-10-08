---
description: After an eval run, "what next" is answered by clustering failures on input structure, analysis only.
tags: [cluster-failures]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

The validation eval just finished: 1,140 / 1,300 correct. Here are the 160 failures, grouped two ways by our script:

By output error: "wrong locant" 70, "missing stereo descriptor" 50, "wrong parent" 40.
By input: steroid skeleton 52, spiro rings 18, 2+ stereocenters (not steroid or spiro) 55, charged species 20, other 15.

What should I work on next? (No shell in this session; answer from what is here.)
