---
name: verify-source
description: "Checks what a specification, standard, RFC, paper, or datasheet actually requires against the primary source, and states the rule with a verbatim quote and its section number. Use when about to state what such a source requires — including when a project doc, research note, prior session, or another agent already asserts the rule. Triggers on 'the spec says', 'per IUPAC/RFC/ISO', 'the standard requires', citing a section number, or resolving a disagreement between an implementation and a claimed rule. Not for ordinary code reading."
---

# verify-source

## The rule

**No rule statement without a verbatim quote from the primary source.**

A paraphrase in a project doc is not a source. A prior session's summary is not a
source. Your memory of the standard is not a source. Another agent's research
output is not a source — it is a claim to be checked.

## Why this exists

A research document once asserted that IUPAC IR-9.3.5.3 requires "the priming
that yields the lowest configuration index". No quotation was attached. Every
later document inherited it, and it manufactured a conflict between the standard
and the maintainer's own reference values that blocked correctness work for a
full session.

The section actually reads: *"The priority numbers on one of the ligands are
arbitrarily primed."* No selection rule at all. The governing rule lived one
section away in IR-9.3.3.4 and maximizes. Thirty minutes with the PDF
dissolved the blocker.

## Procedure

1. **Name the primary source.** The published standard, the paper of record, the
   RFC — not a wiki, not a tutorial, not a previous analysis.
2. **Fetch it.** `curl` it to the scratchpad and cache it; you will read it more
   than once. WebFetch answers a prompt about the page with a small model rather than
   returning its text, so use it only to find where the text lives.
3. **Extract text you can grep.** For PDFs: `pdftotext -layout file.pdf out.txt`.
   Quote only from text you extracted yourself.
4. **Locate and read around it.** `grep -n` the section number and the operative
   phrases (`"highest"`, `"lowest"`, `"shall"`, `"arbitrarily"`), then read the
   surrounding lines. Governing rules are often one section away from where you
   expect.
5. **Quote verbatim**, with the section number, in whatever you write.
6. **If the rule is not there, say so explicitly** — "IR-9.3.5.3 states no
   selection rule" is a finding, and usually a more valuable one than confirming.

## Red flags

| Thought | Reality |
|---|---|
| "The spec obviously says X" | Then quoting it costs one minute. |
| "The research doc already established this" | Did it quote? If not, it asserted. |
| "It's a well-known convention" | Well-known conventions are the ones most often misremembered. |
| "The maintainer and the standard disagree" | Far more often, the *paraphrase* and the standard disagree. Check before picking a side. |
| "I'll cite the section number" | A section number without its text is a paraphrase wearing a costume. |

## Output

State the rule, the verbatim quote, and the section. If a prior document
contradicts the source, correct that document in the same change (or, where you
cannot edit it, name the file and line to correct) — an uncorrected paraphrase will
be inherited again.
