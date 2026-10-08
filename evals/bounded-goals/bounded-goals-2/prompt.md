---
description: A loop that rejects every change is a problem with the objective, not the changes.
tags: [bounded-goals]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Our agent loop has rejected its last 14 candidate changes because each one regressed something (one gave accuracy +0.4 points but runtime +0.3 ms; another made names 2 characters longer). The goals say: maximize accuracy AND minimize runtime AND minimize name length. What's wrong, and what should we change?
