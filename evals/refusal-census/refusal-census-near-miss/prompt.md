---
description: Grouping failures by a structural feature is cluster-failures' job, not refusal-census'.
tags: [refusal-census, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Group our 412 failing molecules by ring system and charge state so we can see where we're losing. Here are the first few failing SMILES: `C1CC2(CC1)CCNCC2`, `c1ccc2[nH]ccc2c1`, `[O-]C(=O)c1ccccc1`, `C1CCC2(C1)OCCO2`.
