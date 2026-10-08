---
description: Line-by-line code review of a diff is not a fable review.
tags: [fable-review, near-miss]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Review this diff for bugs before I merge it:

```diff
-def mean(xs): return sum(xs) / len(xs)
+def mean(xs):
+    if not xs:
+        return 0
+    return sum(xs) / len(xs)
```
