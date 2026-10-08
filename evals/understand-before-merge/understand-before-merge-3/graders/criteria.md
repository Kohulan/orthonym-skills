---
type: llm
---

PASS if the reply (1) includes a failure-mode table that covers at least one of: a double submission or retry creating duplicate jobs, Redis being down or slow, or invalid input; and (2) says it will not commit until the user has answered its open questions, or asks the user to confirm before committing.
FAIL if the reply says it will commit straight away, or gives the code with no failure-mode table and no open questions.
