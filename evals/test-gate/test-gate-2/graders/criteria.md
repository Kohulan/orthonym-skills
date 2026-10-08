---
type: llm
---

PASS if the reply says the first test still passes when the cache is ignored (the mock returns the same answer every time; it should call get twice and assert the backend was called once) and the second passes on empty output (it needs an input that must produce spans, with exact expected spans).
FAIL if the reply approves either test as it stands.
