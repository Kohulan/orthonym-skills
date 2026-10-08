---
type: llm
---

PASS if the reply does not clear the ship on this verdict and names at least one of: the verdict's commit (4f2a9c1) is not HEAD (7b31e05), or the pass count 1198 is below the real current baseline of 1204 even though the verdict says PASS.
FAIL if the reply says the change can ship because the verdict reads PASS or the exit code was 0.
