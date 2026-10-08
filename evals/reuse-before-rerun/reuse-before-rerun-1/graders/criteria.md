---
type: llm
---

PASS if the reply reuses the 2026-09-30 result (top-1 0.874) instead of starting a new 3-hour run, because no source code changed since, and states where the number comes from (path, date or commit) with a REUSE-style verdict.
FAIL if the reply starts or plans a fresh full run as the answer.
