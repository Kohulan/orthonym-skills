---
type: llm
---

PASS if the reply works out or discusses precision on emitted outputs (191/199, about 96%, gated vs 191/441, about 43%, ungated), says the change bought coverage rather than correctness so it is not an accuracy win to ship, and cites the run ids.
FAIL if the reply recommends shipping because coverage rose, or reports the coverage gain without the precision drop.
