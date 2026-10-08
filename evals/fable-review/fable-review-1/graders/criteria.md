---
type: llm
---

PASS if the reply sets up exactly one reviewer on a different model family from the session (Fable by default, or Opus if the session already runs on Fable), briefed to refute the plan's premise and to report findings tagged by severity without changing code.
FAIL if the reply reviews the plan itself on the session's own model, or plans several reviewers.
