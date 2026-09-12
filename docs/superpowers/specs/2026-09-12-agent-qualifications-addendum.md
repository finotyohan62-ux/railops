# Agent Qualifications Profile — Design Addendum

**Date:** 2026-09-12

**Status:** Approved by the product owner after acceptance review with a real SFERIS title PDF.

## Why this addendum exists

The first habilitation prototype was intentionally limited to habilitations. A real SFERIS title showed that one official PDF can also contain two useful professional sections that should not be discarded: **Volet autre(s) Compétence(s)** and **Volet Secourisme**.

The profile design is therefore extended without changing the core upload workflow: one official PDF remains the evidence source, but RailOps extracts and presents its professional data in three separate profile blocks.

## Approved profile blocks

1. **Habilitations** — e.g. TES M, S9, CH1CB1 and their individual validity periods.
2. **Autres compétences** — e.g. Certification - Risques électriques C0 and its acquisition/limit dates.
3. **Secourisme** — validity information present in the Secourisme section of the same title.

These sections are display categories, not three separate uploads.

## Parsing rules

- The parser must preserve the official wording from the PDF whenever possible.
- Habilitations, competencies and secourisme must never be silently mixed together.
- Every dated qualification keeps its own `valid_from` and `valid_until` when those values are present.
- A section that is absent is allowed and renders empty; a section that is present but ambiguous must surface a verification warning rather than inventing data.
- The real supplied SFERIS PDF is not committed to the repository. Regression tests use an anonymized structural fixture only.

## Persistence extension

The existing document model remains unchanged: one active PDF document per agent with older documents archived.

Each extracted row gains a `qualification_type` with exactly one of:

- `habilitation`
- `competence`
- `secourisme`

The activation RPC must reject unknown types. The read RPC must return the type so the UI can rebuild the three profile blocks deterministically.

## Safety and rollout

- No production Supabase migration is applied by this addendum.
- No change is made to scanner, register import, multi-chantier, material persistence or existing sync behavior.
- The feature remains on `feat/agent-habilitations-profile` until the full isolated flow is accepted.
