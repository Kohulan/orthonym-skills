# Installing Orthonym Skills into Claude Code

Claude Code discovers *skills* from `SKILL.md` files under a `skills/` directory in two locations:

- **Project scope** — `<your-project>/.claude/skills/<skill-name>/SKILL.md` — available only when
  Claude Code runs inside that project.
- **User scope** — `~/.claude/skills/<skill-name>/SKILL.md` — available in every Claude Code session
  on the machine.

Each skill here is a self-contained directory (`skills/<name>/` with a `SKILL.md`, sometimes plus
helper files). Installing one = copying its directory into a skills path — or install everything at
once as a plugin (Option 0).

---

## Option 0 — Plugin (everything, two commands)

The repo is a Claude Code plugin marketplace with one plugin. In Claude Code:

```text
/plugin marketplace add Kohulan/orthonym-skills
/plugin install orthonym-skills@orthonym-skills
```

You get every skill (namespaced as `/orthonym-skills:<name>`, e.g. `/orthonym-skills:spy-site`), the
`reference-consult` agent, and the `block-git-add-all` hook. The other four hooks (`ask-gate`,
`guard-holdout`, `guard-regen`, `gate-guard`) are **not** enabled by the plugin; enable the ones you
want per project (see "Hooks" below).
Update with `/plugin update orthonym-skills@orthonym-skills`. Validate a checkout with
`claude plugin validate .`.

## Option 1 — Per-project (recommended to start)

Copy just the skills you want into the project you're working in:

```bash
mkdir -p /path/to/your/project/.claude/skills
cp -r skills/spy-site      /path/to/your/project/.claude/skills/
cp -r skills/check-target  /path/to/your/project/.claude/skills/
cp -r skills/gauntlet-loop /path/to/your/project/.claude/skills/
```

Scope stays local, and you can adapt a project-derived skill's paths without affecting other repos.

## Option 2 — User-global (available everywhere)

Best for the **process** skills (`gauntlet-loop`, `council`, `fable-review`, `spy-site`,
`check-target`, `enumerate-first`, `verify-source`, `prove-invariant`, `test-gate`, `change-asserted-value`,
`bounded-goals`) that need no setup and are useful in any codebase:

```bash
mkdir -p ~/.claude/skills
cp -r skills/gauntlet-loop ~/.claude/skills/
cp -r skills/council       ~/.claude/skills/
cp -r skills/fable-review  ~/.claude/skills/
```

## Option 3 — Clone and track upstream

Keep the repo and pull updates; symlink the skills you use:

```bash
git clone https://github.com/Kohulan/orthonym-skills.git ~/orthonym-skills
ln -s ~/orthonym-skills/skills/spy-site ~/.claude/skills/spy-site
# `git -C ~/orthonym-skills pull` to update
```

Symlinks work as long as Claude Code can resolve them at read time. If your setup does not follow
symlinks, use `cp -r` and re-copy after a `git pull`.

---

## Using a skill

Once installed, a skill can be used two ways:

1. **Explicit** — type its slash name in Claude Code: `/spy-site`, `/gauntlet-loop`, `/council`.
2. **Automatic** — Claude reads each skill's `description` and invokes the matching one when your
   request fits it (e.g. asking "prove this function is even called before I change it" surfaces
   `spy-site`). This is why every `SKILL.md` front-matter has a precise `description` with trigger
   phrases — keep it if you edit a skill.

### Reference docs are different

The files in `reference-docs/` are **not** Skill-tool-invocable (they have no `SKILL.md`). They are
domain-knowledge files. Use one by pointing Claude at it:

```
Read reference-docs/examples-iupac-naming/iupac-naming-rules.md before proposing the fix.
```

or copy it next to your project docs and reference it from your own `CLAUDE.md`.

---

## Wiring up a workflow skill

The **workflow** skills (`kickoff`, `handoff`, `run-gate`, `run-eval`, `eval-loop`,
`cluster-failures`, `refusal-census`, `reuse-before-rerun`, `watching-background-jobs`) encode a measurement discipline with **parameterized
placeholders** for the plumbing — a gate command, an eval command, a verdict file, a refusal-log
parser, a handoff-note path. They run once you substitute your project's equivalents. Before using
one:

1. Read its `SKILL.md` "Wire this up" note and [`skills-catalog.md`](skills-catalog.md).
2. Replace the `<placeholders>` (e.g. `<your-gate-command>`, `<your-eval-command>`,
   `<gate-verdict-file>`) with your project's commands and paths.
3. Keep the *method* — the discipline the skill encodes; swap only the plumbing.

The reasoning is the reusable part; the placeholders mark exactly what is yours to fill in.

---

## Hooks

Five PreToolUse guards live in [`hooks/`](../hooks/). With the plugin installed (Option 0),
`block-git-add-all` is already on. The other four are opt-in: copy the scripts you want and paste only
their entries, and the `env` values they need, from [`hooks/README.md`](../hooks/README.md) into
`.claude/settings.json`. A project copy of the git guard would run on every Bash call next to the
plugin's:

```bash
mkdir -p /path/to/your/project/.claude/hooks
cp hooks/ask-gate.py hooks/guard-holdout.py hooks/guard-regen.py hooks/gate-guard.py \
   /path/to/your/project/.claude/hooks/
```

Without the plugin, also copy the git guard and paste the whole `hooks` block from the same README:

```bash
cp hooks/block-git-add-all.py hooks/block-git-add-all.sh /path/to/your/project/.claude/hooks/
```

`guard-holdout` and `gate-guard` do nothing until their variables (`EVAL_HOLDOUT_PATTERN`,
`GATE_CMD_RE`, `GATE_VERDICT_FILE`) are set in the `env` block of `settings.json` or in the shell
that launches `claude`.

Test each hook with the one-line pipe commands in the same README before relying on it. Open `/hooks`
once in Claude Code after editing settings so the change is picked up.

## Agent

Copy [`agents/reference-consult.md`](../agents/reference-consult.md) into
`/path/to/your/project/.claude/agents/` and fill in the paths of your reference documents at the top.
Claude then offers it as a subagent type.

---

## Requirements

- [Claude Code](https://docs.claude.com/en/docs/claude-code) (the skill mechanism is a Claude Code
  feature; skills are plain Markdown + optional helper files).
- No runtime dependency from this repo itself — skills are instruction text. Any tool a skill *tells
  Claude to run* (a test runner, a gate script) must exist in your own project.
