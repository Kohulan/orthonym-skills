---
type: llm
---

PASS if the reply contains (1) the code, (2) a table of failure scenarios that says what the code does now in each one and whether that is deliberate, covering at least a failed or slow download or a run killed halfway, and (3) a numbered list of open questions for the user that the reply does not answer itself.
FAIL if the reply is code plus prose or tips with no failure-mode table, or every open question is followed by its own answer, or the reply calls the code "production ready" or says it handles all edge cases.
