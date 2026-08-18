# Example domain pack — IUPAC nomenclature

These four documents are a **worked example** of a domain-knowledge pack: durable reference
knowledge you hand an agent so it reasons correctly inside one chemistry sub-domain — here, **IUPAC
nomenclature** (structure ↔ name).

- `iupac-naming-rules.md` — substitutive nomenclature rules, seniority, locants.
- `fused-ring-nomenclature.md` — fused/bridged ring naming.
- `hantzsch-widman.md` — Hantzsch–Widman heterocycle names.
- `opsin-reference.md` — how a name-parsing engine (OPSIN) maps a name back to a structure, used as a
  reference-free round-trip validator.

They are **not** Claude Code skills (no `SKILL.md`, not invocable). An agent uses one by being pointed
at the file: *"read `opsin-reference.md` before proposing the name."*

## Why they're here

Most of `stitch-skills` is chemistry-**general** — the skills work whether you build property models,
reaction predictors, docking pipelines, or naming engines. This pack is the exception on purpose: it
shows what a *domain-specific* knowledge file looks like, so you can build your own for **your**
sub-domain (e.g. a reactivity-rules doc, a force-field-parameter reference, an assay-protocol doc).

Copy this pattern; the naming content itself is only useful if you happen to work on nomenclature.
The generic references (`../rdkit-perception.md`, `../fix-methodology.md`, `../testing-commands.md`)
are broadly useful across chemistry development and live one level up.
