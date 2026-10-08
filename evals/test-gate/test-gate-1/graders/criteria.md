---
type: llm
---

PASS if the tests check both directions: a backend with lag over 30 s is refused, and a healthy backend (status ok, low lag) gets through without an error, so a guard that always refuses would fail them.
FAIL if the tests only check that an unhealthy backend raises.
