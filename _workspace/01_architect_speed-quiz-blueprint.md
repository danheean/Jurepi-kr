# Speed Quiz — Build Blueprint (leader-authored, frozen contracts)

Worktree (ABSOLUTE, all agents operate ONLY here):
`/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-speed-quiz`  (branch `fun/speed-quiz`)

SPEC: `docs/services/fun/speed-quiz/SPEC.md`. Reference sibling to mirror EXACTLY: **new-word**
(`src/lib/new-word/*`, `scripts/generate-glossary.mjs`, `src/components/tools/new-word/*`,
route wiring in `src/app/[locale]/tools/[slug]/page.tsx`, `src/lib/seo.ts`).

## Scope decision (user-confirmed)
- **10 categories** (SPEC's 8 + `sports` + `countries`).
- **Each category = 2 decks: A팀 / B팀** of the SAME difficulty, **10 DISTINCT words each** (fair head-to-head
  "대결" via balanced content — NOT a new engine mode; single-presenter model unchanged).
- Total: **20 decks × 10 words = 200 prompts, bilingual (ko + en)**.

CATEGORY_ORDER (frozen):
`['animals','food','sports','movies','kpop','countries','jobs','brands','proverbs','historical-figures']`

Per-category difficulty (A & B identical within a pair):
| category | difficulty | ko label | en label |
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

Deck slugs: `<category>-a`, `<category>-b` (e.g. `animals-a`, `historical-figures-b`). Globally unique.
Deck titles: ko `"동물 A팀"` / `"동물 B팀"`; en `"Animals Team A"` / `"Animals Team B"`.

## FROZEN: content frontmatter (markdown pairs in `content/speed-quiz/decks/`)
KO file `animals-a.md`:
```yaml
---
title: 동물 A팀
category: animals            # ko canonical
difficulty: easy             # ko canonical  (easy|normal|hard)
words:                       # ko canonical, >=10, terms unique within deck
  - term: 사자
  - term: 호랑이
    hint: 밀림의 왕          # optional, <=30 chars
---
```
EN file `animals-a_en.md` (category/difficulty INHERIT from ko; provides localized title + words):
```yaml
---
title: Animals Team A
words:
  - term: Lion
  - term: Tiger
    hint: King of the jungle
---
```
Rules: en omits category/difficulty (inherit). en.words localized 1:1 with ko order (if en.words absent → inherit ko.words). `_`-prefixed files excluded (`_TEMPLATE.md`, `_TEMPLATE_en.md`).

## FROZEN: schema (src/lib/speed-quiz/schema.ts) — generator re-declares inline (mirror new-word)
```
Word            = { term: string.min(1), hint?: string.max(30) }
DeckFileFront   = { title:min(1), slug?:/^[a-z0-9-]+$/, category?:CategoryEnum,
                    difficulty?:DifficultyEnum, words?: Word[].min(10) }   // ko must have category/difficulty/words
CategoryEnum    = enum(animals,food,sports,movies,kpop,countries,jobs,brands,proverbs,historical-figures)
DifficultyEnum  = enum(easy,normal,hard)
MergedDeck      = { slug:/^[a-z0-9-]+$/, category:CategoryEnum, difficulty:DifficultyEnum,
                    words: Word[].min(10),                 // canonical (ko)
                    ko: { title:min(1), words: Word[].min(10) },
                    en: { title:min(1), words: Word[].min(10) } }   // en.words = own or inherited ko.words
STORE_VERSION = 1
SpeedQuizStore = { version:int>=1, settings:{ lastCategory?:string, lastDifficulty?:string,
                    roundTimeSeconds?:number, shuffleOn:boolean, soundOn:boolean },
                    favorites: string[], recents: string[] }   // key `jurepi-speed-quiz`
safeJsonParse<T>(json, schema): T|null   // never throws
```
Generator validation (each violation → stderr line `file: field — reason`, then `process.exit(1)`):
pair present (both ko+en) · ko required fields · words>=10 · term non-empty · terms unique within deck ·
en.title non-empty · en.words (if present) length==ko.words length · slug unique globally.
Deterministic sort: CATEGORY_ORDER → difficulty(easy<normal<hard) → slug. Emit
`src/components/tools/speed-quiz/data/speed-quiz.generated.json`.

## FROZEN: domain constants (src/lib/speed-quiz/*)
`RECENTS_MAX=10  WORDS_PER_DECK_MIN=10  TIME_PRESETS=[30,60,90]  CATEGORY_ORDER=(above)`
`SOUND_TICK_HZ=800  SOUND_CHIME_HZ=1200  SOUND_BUZZ_HZ=200`

## FROZEN: GameState + reducer (src/lib/speed-quiz/game-reducer.ts) — pure, immutable
```
WordResult   = 'correct'|'pass'|'timeout'|'unrevealed'
WordWithResult = { term:string, hint?:string, result:WordResult }
GameStatus   = 'playing'|'summary'
GameState    = { deckId:string, words: WordWithResult[], currentIndex:number,
                 score:{correct:number,pass:number,timeout:number},
                 roundSettings:{difficulty,roundTimeSeconds:number|null,shuffle:boolean,showHints:boolean},
                 status: GameStatus }
startGame(deck, settings, seed): GameState   // shuffle words if settings.shuffle (fairShuffle+seed), all 'unrevealed', index 0, status 'playing'
markCorrect(s): GameState   // current->'correct', score.correct++, advance (last => status 'summary')
markPass(s):    GameState   // current->'pass', score.pass++, advance
undo(s):        GameState   // if index>0: step back, reset that word to 'unrevealed', decrement its counter
endGame(s):     GameState   // remaining 'unrevealed' -> 'timeout' (count into score.timeout), status 'summary'
```
Timer lives in the HOOK (rAF/interval), NOT the reducer. On 0 → hook dispatches endGame.
`fairShuffle(words, seed)` = Fisher–Yates driven by xorshift32(seed); reproducible; no Math.random.

## FROZEN: i18n key contract  `tools.speed-quiz.*`  (platform-engineer authors ko+en; ui consumes EXACTLY these)
```
meta.title, meta.description
intro.eyebrow, intro.title, intro.lead
categories.all, categories.animals, categories.food, categories.sports, categories.movies,
categories.kpop, categories.countries, categories.jobs, categories.brands, categories.proverbs,
categories.historical-figures, categories.favorites
difficulty.easy, difficulty.normal, difficulty.hard
search.placeholder, search.clear, search.noResults           // noResults uses {query}
deck.wordCount, deck.addFavorite, deck.removeFavorite         // wordCount uses {count}
setup.title, setup.difficulty, setup.roundTime, setup.time30, setup.time60, setup.time90,
setup.unlimited, setup.shuffle, setup.hints, setup.start, setup.cancel
board.correct, board.pass, board.undo, board.end, board.correctScore, board.passScore,
board.hintLabel, board.timeUp, board.of                       // correctScore/passScore use {count}; "of" for "3 / 10"
summary.titleDone, summary.titleTimeout, summary.correct, summary.pass, summary.timeout,
summary.results, summary.wordList, summary.replay, summary.home    // correct/pass/timeout use {count}
sound.mute, sound.unmute
keyboard.title, keyboard.space, keyboard.pass, keyboard.undo, keyboard.end, keyboard.help, keyboard.close
empty.noDecks
howTo.title, howTo.lead, howTo.steps  (steps = array of {title, body})  [answer-first, ≥3 steps, ko+en]
faq.title, faq.items (array of {q,a}, ≥5 items, answer-first, ko+en)
```
NOTE (harness lesson): SEO sections (Intro/HowTo/Faq/StructuredData) render OUTSIDE any `mounted` gate
(prerendered for AI crawlers). Use synchronous isomorphic `useTranslations` (mirror url-encoder's
`UrlEncoderIntro/HowTo/Faq/StructuredData`), NOT async `getTranslations`.

## Layer decomposition & ownership
1. **domain-engineer** — `src/lib/speed-quiz/{schema,slug,merge,catalog,shuffle,game-reducer,sound,favorites}.ts` + `.test.ts` (Vitest, ≥90% domain). Pure, no react/next/DOM (sound.ts: pure tone-spec builder tested; Web Audio play fn guarded/untested). Mirror new-word lib exactly.
2. **content-agent (general-purpose)** — `scripts/generate-speed-quiz.mjs` (mirror generate-glossary.mjs) + `content/speed-quiz/{_TEMPLATE.md,_TEMPLATE_en.md,README.md,decks/<20 pairs>}` + wire `predev`/`prebuild` in package.json + generator validation tests (fixtures: missing-pair, <10-words, dupe-slug → exit 1). RUN generator → commit `speed-quiz.generated.json`.
3. **platform-engineer** — registry entry (`order:8, category:'fun', accent:'sun', icon:'Zap', status:'coming_soon'`→ leader flips to `'live'` at end), `[slug]/page.tsx` dynamic import + slug branch + `generateMetadata` branch, `public/llms.txt` entry, **i18n messages ko+en** (full `tools.speed-quiz.*` tree per contract above).
4. **ui-engineer(s)** — `src/components/tools/speed-quiz/*` + component tests. Consume domain lib + `speed-quiz.generated.json` + frozen i18n keys. DESIGN.md tokens, sun accent, presenter-first scale, WCAG AA, prefers-reduced-motion. Components: SpeedQuiz (orchestrator, 'use client'), useSpeedQuiz (hook: dynamic catalog import + localStorage + timer + sound ctx), DeckBrowser, DeckCard, GameSetup, GameBoard, GameSummary, SoundToggle, SpeedQuizIntro, SpeedQuizHowTo, SpeedQuizFaq, SpeedQuizStructuredData (SoftwareApplication + FAQPage JSON-LD via lib/seo.ts, absoluteToolUrl).
5. **seo-geo-engineer** — verify prerender HTML exposes unique meta/hreflang + valid JSON-LD (url==canonical) + answer-first howTo/faq; llms.txt entry.
6. **qa-integration** — boundary cross-checks + full Vitest coverage + Playwright E2E (SPEC scenarios 1–5) + axe + prerender SEO grep.

## Route rendering (mirror url-encoder pattern — SEO server-rendered around client island)
```
if (slug === 'speed-quiz') return (<>
  <SpeedQuizStructuredData />
  <SpeedQuizIntro />
  <SpeedQuiz />            {/* client SPA: browser/setup/board/summary state switch */}
  <SpeedQuizHowTo />
  <SpeedQuizFaq />
</>)
```

## Build order / waves
- Wave 1 (parallel): domain-engineer ∥ content-agent ∥ platform-engineer(registry+i18n+llms.txt only; route branch LAST).
- Wave 2: ui-engineer(s) after domain lib + generated.json exist.
- Wave 3: platform route branch + status live; seo-geo verify; qa integration + E2E.
- Leader gates: `pnpm typecheck` · `pnpm test` (all) · `pnpm build` · live screenshots (ko/en, 320/1024, board readability) · prerender JSON-LD grep. Then commit.
```
