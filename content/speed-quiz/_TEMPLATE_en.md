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

English template for speed-quiz decks.

Replace title and words (maintaining 1:1 localization with the Korean file).

- **title**: Deck name in English (localized for this language, e.g., "Animals Team A", "Movies Team B")
- **words**: Same count and order as Korean file. Each word has `term` (localized English equivalent) and optional `hint` (localized English clue, ≤30 chars)

Rules:
- English words array must match Korean count (1:1 localization)
- Keep English terms recognizable equivalents of Korean terms
- Hints (if provided in Korean) should be localized to English
- category and difficulty are inherited from the Korean file—do NOT specify them here
