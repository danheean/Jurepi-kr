# Lunar Converter — Leader Contract (shared by all agents)

**작업 워크트리(절대경로, 이 밖으로 나가지 말 것):** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-lunar-converter`
브랜치 `converter/lunar-converter`. 모든 bash는 `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr-lunar-converter && …`, 파일 도구는 절대경로.

SPEC: `docs/services/converter/lunar-converter/SPEC.md`. **localStorage 히스토리는 이미 SPEC에 포함**(recents, 최근 10, key `jurepi-lunar-converter`) — SPEC 업데이트 불필요.

## 핵심 결정: 라이브러리 채택 (SPEC의 per-day 테이블 대체)
- **엔진 = `korean-lunar-calendar` npm (v0.4.0, MIT, KASI 1391–2050 내장, 202KB).** SPEC의 `scripts/generate-lunar-table.mjs` + `lunar-table.ts`(solar일마다 1레코드=24만개=수MB)는 **만들지 않는다.** 이 lib가 곧 "번들된 KASI 테이블"이다(로컬 계산, 네트워크 없음, 결정적 — SPEC 의도 충족). `useConverter` 훅에서 **dynamic import**로 코드스플릿.
- lib API (stateful — 매 변환 새 인스턴스 또는 set→check boolean→read):
  - `setSolarDate(y,m,d): boolean` (범위밖/불가능 날짜 false) → `getLunarCalendar(): {year,month,day,intercalation}`
  - `setLunarDate(y,m,d,intercalation): boolean` (윤달 없으면 false) → `getSolarCalendar()`
  - `getKoreanGapja()/getChineseGapja(): {year:"갑진년"/"甲辰年", month, day, intercalation}`
  - **boolean 반환을 friendly 에러로 매핑** (범위밖·윤달없음·존재않는 날).

## 도메인 계층 (순수, react/next 없음, TDD ≥90%)
`src/lib/lunar-converter/`
- `conversion.ts`: `solarToLunar(y,m,d)` / `lunarToSolar(y,m,d,isLeap)` → `ConversionResult | {error}`. lib 래핑(엔진 주입 가능하게). 범위 1391–2050 검증. **lib는 여기서만 import**, 인스턴스 생성은 함수 내부(순수 입출력).
- `sexagenary.ts`: **완전 순수** `computeSexagenary(lunarYear)` → `{name:"갑진", hanja:"甲辰", english:"Wood Dragon", stemIndex, branchIndex}`. 천간=(year-4)%10, 지지=(year-4)%12. (lib에 의존하지 말고 자체 계산 — 테스트 용이·라벨 english 필요.)
- `zodiac.ts`: **완전 순수** `computeZodiac(lunarYear)` → `{key:"dragon", emoji:"🐉", branchIndex}`. english/ko 이름은 i18n 키. (age-calculator/zodiac.ts 참고하되 여기선 지지 기반.)
- `schema.ts`: zod — Recents 스토어(version, entries[{solarDate,lunarDate,ts}]), ConversionResult, DateRecord.
- `recents.ts`: 불변 ops (`pushRecent`,`pruneUnknown`,`serialize/deserialize`) — **age-calculator/recents.ts 패턴 그대로**, 단 엔트리는 solar+lunar 쌍.
- **정확성 테스트(필수)**: KASI 앵커 날짜 하드코딩 검증 — 2024-03-15(solar)→음 윤2월6일·甲辰·용, 설날/추석 몇 개, 경계 1391/2050, 1390/2051 에러, 윤달 없는 해 윤달선택 에러.

## i18n 계약 (platform 확정 → ui 소비, 드리프트 금지)
`src/i18n/messages/{ko,en}.json` → `tools.lunar-converter`:
- **최상위 `title`, `description` 필수**(footer/home 카드/검색 `searchable-tools` 소비).
- `meta.title`, `meta.description`(generateMetadata + StructuredData).
- `intro.*`(eyebrow/h1/lead), `solar.*`/`lunar.*`(연·월·일 라벨·윤달), `today`, `result.*`(간지/띠 라벨·복사버튼), `recents.*`(헤더·빈상태), `zodiac.<key>`(12띠 이름), `errors.*`(범위밖·윤달없음), `copyToast`, `howTo.*`, `faq.*`.
- 로케일은 `useLocale()` (BCP-47 "ko"/"en") → `Intl.DateTimeFormat(locale,…)`. **i18n 키를 Intl에 넘기지 말 것**(Q&A a Day 교훈).

## 플랫폼 배선 (age-calculator 미러)
- registry.ts 엔트리: id/slug `lunar-converter`, category `converter`, accent `grape`, icon(lucide, 예 `CalendarSync`/`Calendar`), status `live`, isNew, order, keywords(ko+en).
- `[locale]/tools/[slug]/page.tsx`: import 블록 + `dynamic(LunarConverter)` + `generateMetadata` `lunar-converter` 분기(`meta.title/description`) + slug 분기 `<LunarConverterStructuredData/><Intro/><LunarConverter locale={locale}/><HowTo/><Faq/>` (Intro/HowTo/Faq/StructuredData = **mounted 게이트 밖 SSR**).
- `public/llms.txt` 항목 추가. sitemap은 registry에서 자동.
- seo.ts 헬퍼 재사용: `buildToolMetadata`, `absoluteToolUrl`, `softwareApplicationJsonLd`, `faqPageJsonLd`, `breadcrumbListJsonLd`. **하드코딩 URL 금지.**

## UI 계층 (DESIGN.md 토큰, grape=정체성, brand=CTA복사, WCAG AA, ≥44px)
`src/components/tools/lunar-converter/`: LunarConverter(orchestrator "use client")·useConverter(dynamic import+localStorage+파생변환+copy)·SolarInput·LunarInput(윤달 토글)·TodayButton·ConversionResult·RecentsList·ErrorMessage·Intro·HowTo·Faq·StructuredData. 데스크톱 2컬럼(입력40%|결과60% sticky), 모바일 단일컬럼 무overflow.
- **팬텀 토큰 금지**: 실존 토큰만(`bg-accent-grape`/`bg-brand`/`text-on-brand`/`bg-surface-muted` 등). 떠있는 레이어는 명시적 너비.

## 게이트 (리더 직접 재검증)
tsc 0 · 도메인 ≥90%/전체 ≥80% · KASI 앵커 정확성 · 빌드 SSG(ko/en) · 전체 E2E(신규+선존 회귀0) · 프리렌더 HTML(고유 title·hreflang·JSON-LD url==canonical·howTo/FAQ SSR) · 라이브 시각(ko/en/320px/콘솔0).
