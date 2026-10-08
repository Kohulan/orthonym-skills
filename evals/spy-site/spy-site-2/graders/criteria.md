---
type: llm
---

PASS if the reply's first step is to count calls to `_choose_parent_chain()` for the 40 listed molecules (for example with a call-counting spy in a fresh process) before changing any weight, and it says that zero calls would mean the weights are the wrong place to work.
FAIL if the reply proposes new weights, a tuning or grid-search plan, or an edit to the function without first measuring that it runs for those molecules.
