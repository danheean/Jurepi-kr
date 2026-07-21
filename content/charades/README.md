# 몸으로 말해요 (Charades) — Content Authoring Guide

Decks live as markdown pairs in `content/charades/decks/`: a Korean file (`<deck>.md`, canonical for
`category`/`difficulty`/`words`) and its English counterpart (`<deck>_en.md`, per-locale `title` +
optional per-locale `words`; if `words` is omitted the English deck inherits the Korean terms verbatim).

Adding a deck is a content-only change — drop the pair in `content/charades/decks/`, run
`node scripts/generate-charades.mjs` (or `pnpm dev` / `pnpm build`, which run it automatically via
`predev`/`prebuild`), and it appears in the deck browser with zero code changes.

## The one rule that matters: mimeable without speech

This tool's entire reason for existing (as distinct from the sibling `speed-quiz` tool) is that every
prompt word must be **physically demonstrable in silence** — no talking, no spelling, no sound effects,
no pointing at real objects in the room. Before adding a word, run it through this checklist:

- [ ] Can a person identify this from gesture/posture/facial-expression ALONE, without knowing any
      spoken word, brand name, or written phrase?
- [ ] Is it distinguishable by MOVEMENT/POSTURE rather than by SOUND (avoid animals/actions where the
      only differentiator is a noise, e.g. a cicada, a ringing phone)?
- [ ] Is it a generic noun/role/action/emotion, NOT a specific copyrighted character or brand (use
      "닌자"/"해적"/"마법사" as archetypal roles, never a named franchise character)?
- [ ] Is it concrete and physical, NOT an abstract concept, proverb, idiom, or four-character phrase
      (those stay in speed-quiz's `proverbs` deck — don't duplicate them here)?
- [ ] Is it unique within its deck (no near-duplicates)?

See `docs/services/fun/charades/SPEC.md`'s `content_curation_policy` section for the full policy,
the six category definitions, and a list of words explicitly considered and rejected (so future authors
don't re-add them).

## Categories

`actions` (easy) · `animals` (easy) · `occupations` (normal) · `characters` (normal) · `sports` (normal) ·
`emotions` (hard).

## Field reference

| Field | Required (ko) | Required (en) | Notes |
|---|---|---|---|
| `title` | yes | yes | Per-locale display name |
| `slug` | no | n/a (ko canonical) | ASCII, `[a-z0-9-]+`; derived from filename if omitted |
| `category` | yes | no (inherits ko) | One of the six categories above |
| `difficulty` | yes | no (inherits ko) | `easy` \| `normal` \| `hard` |
| `words` | yes, ≥10 | no (inherits ko verbatim if omitted) | `{ term: string, hint?: string (≤30 chars) }` |

## Validation (build-time, fails the build on any violation)

- Every Korean file must have a matching English file (and vice versa).
- Korean file must have `category`, `difficulty`, and ≥10 `words`.
- English file must have a non-empty `title`.
- If English `words` is present, its length must match the Korean `words` length.
- Word `term`s must be unique within a deck (both ko and en).
- `slug` must be globally unique across all decks (not just within a category).

Run `node scripts/generate-charades.mjs` directly to see validation errors with file/field/reason.
