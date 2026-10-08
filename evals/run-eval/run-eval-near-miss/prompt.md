---
description: A CI caching question that mentions a benchmark must not trigger run-eval.
tags: [run-eval, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Our benchmark GitHub Actions job spends 12 minutes rebuilding the conda environment on every push. Show me how to cache it in the workflow YAML.
