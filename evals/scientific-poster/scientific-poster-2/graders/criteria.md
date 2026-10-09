---
type: llm
---

PASS if the steps read the pins from the board's database (not from a screenshot or from memory), map each pin's percent position onto the slide geometry to find the element it points at, and apply the change in the build script before rebuilding.
PASS only if the plan re-renders the poster, republishes the board image at the same address and marks the applied pins done; a pin that needs a decision stays open with a question.
FAIL if the steps edit the pptx by hand, publish a new board instead of updating the existing one, or claim to have applied changes without reading the pins.
