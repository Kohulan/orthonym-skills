---
type: llm
focus: trace
---

PASS if, without asking the user for context, the session reports the current phase (Phase 3, ring-system featurizer), the last commit, a baseline number (1204/1250 or 0.874) and the next task (spiro-ring descriptors), treats the handoff note as current (drift check PASS or equivalent), and then turns to the spiro-ring task. Saying it cannot edit files or run commands in this session is fine.
FAIL if the session asks the user what to work on, calls the handoff note stale or drifted, or turns to a task other than the spiro-ring descriptors.
