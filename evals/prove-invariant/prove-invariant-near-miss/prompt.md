---
description: Updating a failing snapshot belongs to change-asserted-value, not prove-invariant.
tags: [prove-invariant, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

This snapshot test fails after my fix; update the snapshot so CI goes green. It asserts `canonical('OCC') == 'CCO'` and now gets 'OCC'.
