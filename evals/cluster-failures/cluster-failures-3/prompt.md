---
description: An output-shaped bucket ("output too short") is rejected in favour of input structure and a coverage tell.
tags: [cluster-failures]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Our failure categorizer says 40% of failures are "output too short" (it compares len(output) to the heavy-atom count). Is that the biggest failure class to fix? I was thinking of padding the short outputs. (No shell in this session; answer from what is here.)
