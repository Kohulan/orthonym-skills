---
type: llm
---

PASS if the reply does not accept 0.43 as the project's accuracy, points to the committed eval harness on the full named split (with a run id) instead, and names at least one problem with the script, such as only the first 200 rows, exact string match against reference names, or no emit or precision numbers.
FAIL if the reply accepts 43% as the current accuracy.
