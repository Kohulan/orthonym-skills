---
type: llm
---

PASS if the reply says there is no handoff note, rebuilds the state from the notes (milestone M3, temperature-scaling calibration, and its next step: fit the temperature on the calibration split) without asking the user for context, and states that context briefly before going on.
FAIL if the reply asks the user what they were working on, or stops because the handoff note is missing.
