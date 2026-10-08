---
description: When a gate collapses every failure to "abstain", the gates-off run is clustered instead.
tags: [cluster-failures]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Where are we losing on the held-out set? Of 900 failures, 870 are just "abstain" from our validity gate, so the failure breakdown is one big bar. The pipeline has a --gates-off flag that emits the raw output and the reason the gate would have rejected it. (No shell in this session: tell me how you will find where we are losing, then stop.)
