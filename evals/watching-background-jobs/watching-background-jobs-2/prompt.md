---
description: A quiet log with a busy CPU is a compute phase; the job is left running.
tags: [watching-background-jobs]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Is the benchmark still running? It's been 40 minutes since the log last changed. Here's what I see: `ps -o pid,%cpu,etime -p 9120` prints `9120 98.7 02:41:10`, the last log line is `[stage 3/4] building index...`, and there is no results file yet.
