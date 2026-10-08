---
type: llm
---

PASS if, before any edit to assign_labels(), the reply plans to prove the function actually runs for the failing inputs (for example a call-counting spy run in a fresh process), checks that spy against at least two known inputs that do reach the function, and treats zero calls as a refutation of the roadmap's claim.
FAIL if the reply goes straight to editing or proposing a patch to assign_labels() without first measuring that it is called for the failing inputs.
