# Speed Quiz Deck Authoring Guide

Welcome! This directory holds bilingual markdown pairs that define Speed Quiz decks. The build system scans these files at compile time, validates them, and bakes them into a static JSON catalog.

## Quick Start

1. Copy `_TEMPLATE.md` and `_TEMPLATE_en.md` as your starting point.
2. Rename to `<deckname>.md` and `<deckname>_en.md` (e.g., `animals-a.md` and `animals-a_en.md`).
3. Fill in `title`, `category`, `difficulty`, and `words`.
4. Run `pnpm predev` to validate and generate the catalog. If errors, the build will fail with a clear message.

## File Structure

```
content/speed-quiz/
├── _TEMPLATE.md           # Korean template (excluded from build)
├── _TEMPLATE_en.md        # English template (excluded from build)
├── README.md              # This file
└── decks/
    ├── animals-a.md       # Korean deck
    ├── animals-a_en.md    # English deck (pair)
    ├── animals-b.md
    ├── animals-b_en.md
    ├── ...
```

**Rule: Files prefixed with `_` are excluded from the generator (templates only).**

## Deck Metadata

### Korean File (`<deck>.md`)

Must include:
- **title** (required): deck name in Korean (e.g., `"동물 A팀"`, `"영화 B팀"`)
- **category** (required): one of:
  - `animals` (동물, easy)
  - `food` (음식, easy)
  - `sports` (스포츠·올림픽, normal)
  - `movies` (영화, normal)
  - `kpop` (K-pop, normal)
  - `countries` (나라, normal)
  - `jobs` (직업, easy)
  - `brands` (브랜드, normal)
  - `proverbs` (속담, hard)
  - `historical-figures` (역사인물, hard)
- **difficulty** (required): one of `easy`, `normal`, `hard`
- **words** (required): array of ≥10 objects

### English File (`<deck>_en.md`)

Must include:
- **title** (required): deck name in English (e.g., `"Animals Team A"`, `"Movies Team B"`)
- **words** (optional but recommended): array of ≥10 objects with English equivalents

**Important:**
- The English file **inherits** category and difficulty from the Korean file—do not repeat them.
- If English words are omitted, the Korean words are reused verbatim (useful only for English-neutral content like proper nouns).
- English words **must match** the Korean word count (1:1 localization).

## Word Format

Each word is an object with:
- **term** (required): the prompt word (1–10 chars typical)
  - Korean: 사자, 호랑이, 곰, etc.
  - English: Lion, Tiger, Bear, etc.
- **hint** (optional): a clue (≤30 chars)
  - Example: `"밀림의 왕"` / `"King of the jungle"`
  - Hints are most useful in normal/hard decks; easy decks typically omit them.

## Validation Rules

The generator validates the following at build time. **Any violation causes the build to fail:**

1. **Pair integrity**: Both Korean and English files must exist for each deck.
2. **Required fields**: Ko file must have category, difficulty, words (≥10); en file must have title.
3. **Word count**: ≥10 words per deck.
4. **Word term uniqueness**: No duplicate terms within a single deck.
5. **English word count**: If English words are present, count must match Korean.
6. **Slug uniqueness**: Each deck slug must be globally unique (no two decks share the same slug).
7. **Category & difficulty**: Valid enum values only.
8. **Hint length**: ≤30 characters.

## Category & Difficulty Pairings

| Category | Difficulty | Ko Label | En Label |
|---|---|---|---|
| animals | easy | 동물 | Animals |
| food | easy | 음식 | Food |
| sports | normal | 스포츠·올림픽 | Sports & Olympics |
| movies | normal | 영화 | Movies |
| kpop | normal | K-pop | K-pop |
| countries | normal | 나라 | Countries |
| jobs | easy | 직업 | Jobs |
| brands | normal | 브랜드 | Brands |
| proverbs | hard | 속담 | Proverbs |
| historical-figures | hard | 역사인물 | Historical Figures |

## A & B Deck Strategy

For head-to-head "대결" fairness:
- Category has two decks: **A팀** and **B팀** (same difficulty).
- **A and B use completely distinct word lists** — no word appears in both. This ensures fair competition and balanced difficulty.
- Example:
  - `animals-a.md`: dog, cat, lion, bear, giraffe, penguin, eagle, shark, snake, frog
  - `animals-b.md`: rabbit, fox, owl, fish, pig, cow, horse, turtle, whale, butterfly
  - ❌ **Bad**: both include "dog" — unfair!
  - ✓ **Good**: no overlap — fair!

## Content Quality Guidelines

### Easy Decks (animals, food, jobs)
- Simple, recognizable terms
- Common everyday objects or animals
- No advanced knowledge required
- Hints optional (usually omitted)

Examples:
- Animals: dog, cat, bird, fish, bear
- Food: apple, bread, rice, pizza, kimbap
- Jobs: doctor, teacher, police, farmer, nurse

### Normal Decks (sports, movies, K-pop, countries, brands)
- Moderately specific terms
- Some cultural/current knowledge helpful
- Popular or well-known references
- Hints recommended (optional)

Examples:
- Sports (Olympic focus): basketball, gymnastics, swimming, archery
- Movies: Parasite, Titanic, Avatar, Inception
- K-pop: BTS, BLACKPINK, IVE, Stray Kids
- Countries: Korea, Japan, France, Brazil
- Brands: Samsung, LG, Hyundai, CJ

### Hard Decks (proverbs, historical-figures)
- Specialized knowledge or cultural depth
- Proverbs: Korean 속담 or 사자성어 (idiomatic phrases)
- Historical figures: specific individuals, possibly obscure
- Hints strongly recommended

Examples:
- Proverbs: 닭 쫓던 개 지쳐 넘어진다 (the dog chasing the chicken got tired and fell over)
- Historical figures: 세종대왕 (King Sejong), 이순신 (Admiral Yi Sun-shin)

## File Naming

Use lowercase with hyphens:
- ✓ `animals-a.md`, `sports-normal-b.md`, `kpop-a.md`
- ✗ `Animals-A.md`, `sports_normal_b.md`, `KpopA.md`

The slug is derived from the filename if not explicitly set in frontmatter.

## Example: Complete Deck Pair

### animals-a.md (Korean)
```yaml
---
title: 동물 A팀
category: animals
difficulty: easy
words:
  - term: 사자
  - term: 호랑이
    hint: 밀림의 왕
  - term: 곰
  - term: 코끼리
  - term: 기린
  - term: 펭귄
  - term: 독수리
  - term: 상어
  - term: 뱀
  - term: 개구리
---
```

### animals-a_en.md (English)
```yaml
---
title: Animals Team A
words:
  - term: Lion
  - term: Tiger
    hint: King of the jungle
  - term: Bear
  - term: Elephant
  - term: Giraffe
  - term: Penguin
  - term: Eagle
  - term: Shark
  - term: Snake
  - term: Frog
---
```

## Build & Deploy

1. **Validate locally**: `pnpm predev` scans, parses, and validates all decks. Errors halt the build.
2. **See generated output**: `src/components/tools/speed-quiz/data/speed-quiz.generated.json` contains the merged catalog.
3. **Run game**: Decks appear in `/ko/tools/speed-quiz` and `/en/tools/speed-quiz` automatically (no manual wiring needed).

## Troubleshooting

### Build fails: "missing English file"
- Make sure you have **both** `animals-a.md` **and** `animals-a_en.md` (pair required).

### Build fails: "≥10 words required"
- Count the words array; minimum 10 per deck.

### Build fails: "duplicate word terms"
- Check that all terms are unique within the deck (no repeated animals, actors, etc.).

### Build fails: "English words count must match Korean"
- Korean has 10 words; English must also have exactly 10 (1:1 pairing).

### Build fails: "duplicate slug"
- Slug is derived from filename. Make sure no two decks share the same base name. Example: `animals-a` and `animals-b` are fine; `animals` (duplicated) is not.

### Words don't appear in the game
- Run `pnpm predev` or `pnpm prebuild` to regenerate the catalog.
- Check `src/components/tools/speed-quiz/data/speed-quiz.generated.json` to verify content is there.

## Advanced: Custom Slug

If you want to override the slug derived from the filename, add `slug` to the Korean frontmatter:

```yaml
---
title: 동물 A팀
category: animals
difficulty: easy
slug: my-animals-deck-a  # Custom slug (must be globally unique)
words:
  - ...
---
```

Rarely needed; usually the filename-based slug is fine.

---

Happy authoring! 🎮
