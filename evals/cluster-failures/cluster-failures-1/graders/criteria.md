---
type: llm
---

PASS if the reply ranks the work by the input-structure groups (steroid, spiro, stereocenters, charged), not by the output-error labels, picks one cluster to work on, and says to read that cluster's failing rows before fixing.
FAIL if the reply ranks by the output-error labels (for example "fix wrong locant first"), or proposes a per-molecule special case or a rewrite of output strings.
