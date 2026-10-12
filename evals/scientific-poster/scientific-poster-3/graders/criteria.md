---
type: llm
---

PASS if the plan keeps A1 and the benchmark emphasis as given without asking for them again; says the layout is portrait only and offers portrait instead of landscape; takes the numbers (71.3%, 50k, 2.1 s, Apache-2.0, the repo) from the README only and reads the two other tools' numbers from the README's table rather than inventing them; and names a scripted build that is validated and rendered before the user sees it, with a review step on the rendered poster.
FAIL if the reply invents a number for the other tools, changes the size, promises or recommends a landscape layout, silently switches to portrait, or proposes a slide deck or a hand-drawn image instead of a poster built from a script.
