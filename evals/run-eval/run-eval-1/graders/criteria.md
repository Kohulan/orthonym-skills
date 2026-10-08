---
type: llm
---

PASS if the reply (1) plans to use the project's committed eval harness on the dev split rather than a new ad-hoc script, and (2) plans to report the headline correct rate together with the emit (coverage) rate and precision on emitted outputs, citing the run ids before and after.
FAIL if the reply plans to write its own measurement script, would report only one accuracy number, or plans to run the held-out split.
