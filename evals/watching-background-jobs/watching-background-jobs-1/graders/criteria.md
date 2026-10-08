---
type: llm
---

PASS if the plan treats the gate as done only when results/verdict.json is newer than the launch (not merely present), keeps the watch loop in the main agent with scheduled wake-ups spaced to the job's pace (not 60-second polling) plus the exit notification, and reports the verdict first with its numbers when the job ends.
FAIL if the plan treats the existing results/verdict.json as completion, or hands the watching to a background subagent and simply ends.
