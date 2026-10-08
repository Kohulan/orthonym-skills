---
description: Attributing abstentions to the code site that blocked them is refusal-census, not cluster-failures.
tags: [cluster-failures, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Our run log tags each abstention with the code site that refused it: perceive_rings() 310, assign_locants() 120, check_valence() 95. Some inputs are refused at more than one site. Which site is the only blocker for the most inputs, so we know what to build first to raise coverage?
