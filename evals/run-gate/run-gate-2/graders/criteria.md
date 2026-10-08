---
type: llm
---

PASS if the reply picks `scripts/gate.sh --fast` for this mid-iteration check and says a fast pass is not enough to ship (the full gate is still needed before shipping).
FAIL if the reply launches the full 2-hour gate for this check, or treats a fast pass as clearance to ship.
