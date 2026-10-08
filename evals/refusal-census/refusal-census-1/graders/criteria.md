---
type: llm
---

PASS if the plan (1) parses the per-row log into refusal sites and counts each site once per input (row 17's two LOCANT_TIE lines count once), and (2) ranks sites by sole-blocker count (inputs where that site is the only one that fired), with first-refusal and touched counts only beside it.
FAIL if the plan ranks by raw log-line counts or by touched count alone, or tries to answer from the UNNAMEABLE label without the per-row logs.
