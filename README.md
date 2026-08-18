# stitch-skills

**Claude Code skills for measurement-driven chemistry development.**

A collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) *skills* — packaged
instruction sets Claude loads on demand to follow a specific workflow — aimed at anyone building
**chemistry software or ML tools**: property prediction, structure↔name, reaction / retrosynthesis
prediction, docking / QSAR, molecular generation, cheminformatics pipelines.

They were hardened on a real deterministic cheminformatics engine and generalized here so the
*method* transfers to any chemistry sub-domain. The through-line of every skill:

> **Decide from measurement, not from a confident guess.** Prove a code site is on the execution path
> before you edit it. Prove a fix target is a real defect class before you build. Bound your
> objectives before you optimise. Get an adversarial second opinion before you ship a load-bearing
> claim. Attribute failures to the exact site that produced them.

> **Topics:** `claude` · `claude-code` · `agent-skills` · `cheminformatics` · `chemistry` · `ml`

## The skills

**Process skills — ready to use, no setup:**

| Skill | Purpose |
|---|---|
| [`gauntlet-loop`](skills/gauntlet-loop/) | Turn any goal into a builder-vs-harsh-critic loop that runs until it beats a stated bar |
| [`council`](skills/council/) | A 3-voice, search-first process for strategy / prioritization / "your call" decisions |
| [`fable-review`](skills/fable-review/) | Adversarially review a plan / finding / diagnosis with a cross-model reviewer before shipping |
| [`spy-site`](skills/spy-site/) | Prove a code site is actually on the execution path *before* editing it |
| [`check-target`](skills/check-target/) | Validate a proposed fix target is a real, single defect class before any code is written |

**Workflow skills — wire in your project's commands once (each says exactly what to substitute):**

| Skill | Purpose |
|---|---|
| [`run-gate`](skills/run-gate/) | Run a regression gate correctly: fast pre-check → background launch → wait on a verdict file → read the *structured* verdict, not the exit code |
| [`run-eval`](skills/run-eval/) | Measure accuracy on a fixed split, reading several numbers (not one) so you can tell "fixed a wrong output" from "stopped emitting one" |
| [`eval-loop`](skills/eval-loop/) | The repeatable measure→diagnose-one-class→fix-at-root→re-measure→gate→log loop, with bounded objectives |
| [`cluster-failures`](skills/cluster-failures/) | Group failures by a *structural feature of the input molecule* to decide what to fix next (analysis only) |
| [`refusal-census`](skills/refusal-census/) | Attribute abstentions/failures to the exact code site that produced them; rank build order by measured *sole-blocker* count |
| [`kickoff`](skills/kickoff/) | Start/resume a session by self-priming from durable state (handoff note + notes + git) instead of a hand-written prompt |
| [`handoff`](skills/handoff/) | End-of-session handoff — verify durable memory is written and produce a next-session resume note |

**Reference docs** ([`reference-docs/`](reference-docs/)) — domain knowledge you point Claude at (not
invocable). `rdkit-perception`, `fix-methodology`, `testing-commands` are chemistry-general; the
[`examples-iupac-naming/`](reference-docs/examples-iupac-naming/) pack is a *worked example* of a
domain-specific knowledge file, for when you build your own.

## Why "chemistry" and not "any code"?

The process skills are genuinely domain-neutral, but the workflow skills assume the texture of
chemistry-tool development: molecules and structures as inputs, reference-free validation by
round-tripping through a parser/canonicalizer (e.g. RDKit → canonical InChIKey), fixed benchmark
splits, and models/pipelines that *abstain* rather than emit a wrong structure. That framing is what
makes them concrete instead of generic advice.

## Install

See **[`docs/INSTALL.md`](docs/INSTALL.md)**. Short version — copy a skill directory into a skills path
Claude Code reads:

```bash
# per-project
cp -r skills/spy-site  /path/to/your/project/.claude/skills/
# user-global (every session on this machine)
cp -r skills/spy-site  ~/.claude/skills/
```

Invoke by name in Claude Code — `/spy-site` — or let Claude pick it up from its description when your
task matches. Per-skill "what to wire up" notes are in [`docs/skills-catalog.md`](docs/skills-catalog.md).

## License

[MIT](LICENSE) © 2026 Kohulan. Skills are instruction text — use, adapt, and redistribute freely.
