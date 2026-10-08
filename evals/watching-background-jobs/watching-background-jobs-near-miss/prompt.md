---
description: A post-mortem on a finished, crashed job is not a watch.
tags: [watching-background-jobs, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Last night's benchmark crashed. Here's the end of the log: `Traceback (most recent call last): ... MemoryError` at row 41,022 of 60,000. Why did it die?
