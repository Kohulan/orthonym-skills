---
description: A spy that records zero on its known positives is broken, not proof that the site is off the path.
tags: [spy-site]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

I wrapped `format_locants()` with a call counter and ran the 25 failing rows: 0 calls. I also ran the two inputs I was sure go through it: 0 calls there too. The handoff note says the missing-locant fix belongs in `format_locants()`. So the note is wrong and I should stop working on that function, right? (The repository is not available in this session; answer from what I've told you.)
