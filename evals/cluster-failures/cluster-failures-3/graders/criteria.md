---
type: llm
---

PASS if the reply says a length-based bucket describes the output, not the cause, proposes grouping failures by a structural feature of the input (or an atom-coverage check instead of output length), and rejects padding the outputs.
FAIL if the reply accepts "output too short" as the class to fix, or endorses padding or rewriting outputs.
