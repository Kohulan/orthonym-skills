---
type: llm
---

PASS if the plan (1) works one failure cluster per iteration, in the order measure, diagnose the cluster, fix, re-measure, check the gate and bounds, log; (2) says a change that worsens a hard bound (protected set or precision) is reverted, not traded; and (3) stops after three iterations with a report across the bounds.
FAIL if the plan fixes several clusters in one iteration, has no re-measure or gate step after each fix, or plans to measure on the held-out split.
