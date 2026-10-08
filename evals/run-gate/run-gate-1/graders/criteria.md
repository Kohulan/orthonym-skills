---
type: llm
---

PASS if the plan commits src/rings.py before launching, runs the gate in the background with no timeout and waits for out/verdict.json (not pgrep or a foreground sleep loop), and then checks the verdict's fields (new regressions, pass count against the current baseline) rather than the exit code.
FAIL if the plan runs the gate before committing, wraps it in a timeout, or treats exit code 0 as the result.
