---
type: llm
---

PASS if the reply writes (or plans to write) a short handoff note file with the last commit, the baseline and the next task, and says the next session can start with 'kickoff' or 'continue' instead of a pasted prompt.
FAIL if the reply's main output is a long hand-written prompt for the user to paste, with no handoff note.
