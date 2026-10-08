---
type: llm
---

PASS if before scoping any fix, the reply plans to recompute the 'unbracketed-prefix' signature over all rows of the run, passing rows included, report how many matching rows already pass, and split the matching rows by cause.
FAIL if the reply scopes or designs one fix for the 140 rows without checking whether passing rows match the same signature.
