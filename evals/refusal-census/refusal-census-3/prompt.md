---
description: A census from another split, tier and commit must not size a build.
tags: [refusal-census]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Here's last week's refusal census from the dev split (tier T3, commit 9e8d7c6): RING_NO_HANDLER is the sole blocker on 58 of 300 failing rows. Use it to size the build for our goal, which is defined on tier T5 of the test split at commit a1b2c3d. How many T5 failures will the ring handler fix? There is no repo in this session; answer from this.
