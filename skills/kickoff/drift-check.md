# Drift-check protocol (cheap/fast agent)

A cheap, fast subagent runs this at the start of every session (spawned by the `kickoff`
skill's step 0, or by a session-start hook if your project wires one). Its job: catch
drift from the authoritative roadmap **before** any work begins, and return a crisp
verdict.

Wire this up: substitute your project's actual file paths in step 1 below. If your
project doesn't keep a formal roadmap doc, this check degrades gracefully to steps 2–4
(handoff note vs git vs scope) — still worth running.

## What the agent reads (read-only; no code changes, no builds, no external tool calls)

1. `<your-roadmap-doc>` — the **authoritative** plan: especially its **mission/goal**,
   any **locked decisions** (design choices the project has explicitly settled and
   forbidden re-litigating), and the **phase/milestone sequence** (which phase is
   current). If your project has superseded an older roadmap with a newer one, read the
   current one and only consult the older one for locked decisions it explicitly says
   still bind.
2. `<your-handoff-note>` — the declared NEXT TASK (often named something like
   `NEXT-SESSION.md`; written by your project's end-of-session/handoff step, if it has
   one).
3. `git log -8 --oneline` — what actually shipped recently.
4. The active plan file for the current phase, if your project's workflow names one
   (e.g. a spec/plan doc under a `plans/` directory).

## The check — answer each, then a verdict

1. **Locked-decision conflict?** Does the NEXT TASK (or the obvious next action)
   contradict any locked decision in the roadmap? Common examples worth checking for:
   - a "cite the primary source for every rule" boundary, if
     your project has one.
   - a defined tier/quality bar (e.g. "best-effort" vs "fully verified") and which
     targets apply to which tier — don't let a best-effort target get silently promoted
     to a hard requirement, or vice versa.
   - a correctness gate that must run on every emission (e.g. "never emit an unverified
     result without a fallback/refusal path") — check the next task doesn't bypass it.
   - a settled "why does this project exist / what differentiates it" decision — don't
     let a session re-litigate a decision the roadmap already closed.
2. **Phase-order conflict?** Is the NEXT TASK the current roadmap phase, or has work
   jumped ahead / sideways without the roadmap being updated first?
3. **Anchor integrity?** Does the handoff note's "last commit" and phase match
   `git log`? If not, the anchor is stale.
4. **Scope creep?** Is the next action a phase in the roadmap, or unplanned work?

## Output (return this verbatim shape, ≤10 lines)
```
DRIFT CHECK — <PASS | DRIFT | STALE-ANCHOR>
Current phase: <phase id + title from roadmap>
Next task (handoff note): <one line>
Verdict: <PASS = aligned; DRIFT = names the conflicting locked-decision/phase; STALE = git≠anchor>
If DRIFT/STALE: the ONE correction to make before working.
```

Keep it to the verdict — do not summarize the whole roadmap. If PASS, one line is enough.
