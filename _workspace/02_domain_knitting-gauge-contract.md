# knitting-gauge 도메인·훅 계약 (UI 소비용) — 리더 확정본

> 도메인 테스트 148/148 GREEN, lib 커버리지 94.6%. 이 계약은 구현 완료된 실코드 기준이다.
> 원본: `src/lib/knitting-gauge/{schema,units,gauge,store}.ts`, `src/components/tools/knitting-gauge/useKnittingGauge.ts`

## 1. 도메인 타입

```ts
// schema.ts
type Gauge = { stitches: number; rows: number; swatchW: number; swatchH: number; unit: 'cm'|'inch'; note?: string }
// gauge.ts
interface CountResult { value: number; rounded: number; actual: number; delta: number }
// 무효 입력(0/음수/비유한) → 도메인 함수는 null 반환 또는 가드 — UI는 null이면 중립 표시(NaN/Infinity 노출 금지)
```

## 2. useKnittingGauge() 반환 (전체)

```ts
{
  gauge: Gauge, setGauge(next: Gauge): void,
  unit: 'cm'|'inch',            // gauge.unit 파생 — 별도 상태 아님
  handleUnitToggle(): void,      // 스와치: 기본값 10↔4 스냅, 커스텀 값 2.54 정확 변환. 목표치수: 항상 2.54 정확 변환
  mode: 'dimToCounts'|'countsToDim'|'patternRescale', setMode,
  targetWidth, setTargetWidth, targetLength, setTargetLength,            // Mode 1
  stitchCount, setStitchCount, rowCount, setRowCount,                    // Mode 2
  patternGaugeStitches, setPatternGaugeStitches, patternGaugeRows, setPatternGaugeRows,
  patternSwatchWidth, setPatternSwatchWidth, patternSwatchHeight, setPatternSwatchHeight,
  patternCount, setPatternCount,                                          // Mode 3
  dimToCountsResult: { stitches: CountResult, rows: CountResult },
  countsToDimResult: { width: number, length: number },
  patternRescaleResult: { stitches: CountResult, rows: CountResult },
  projects: Array<{name: string; gauge: Gauge}>, recents: Gauge[],
  handleSaveProject(name), handleApplyProject(name), handleRemoveProject(name), handleAddRecent(),
}
```

지속성: localStorage `jurepi-knitting-gauge` — 현재 gauge(디바운스 300ms)+projects/recents(즉시) 자동. UI가 신경 쓸 것 없음.

## 3. 컴포넌트 Props 계약 (양 UI 엔지니어 공통 — 침묵 변경 금지)

| 컴포넌트 | Props |
|---|---|
| `GaugeInput` | `{ gauge: Gauge; unit: 'cm'\|'inch'; onGaugeChange(next: Gauge): void; onUnitToggle(): void }` |
| `ModeTabs` | `{ mode: Mode; onModeChange(mode: Mode): void }` |
| `ResultCard` | `{ label: string; result: CountResult \| null; unitLabel: string; copySummary?: string }` (copySummary 있으면 복사 버튼 렌더) |
| `DimToCounts` | `{ targetWidth: number; targetLength: number; onTargetWidthChange(n): void; onTargetLengthChange(n): void; result: {stitches: CountResult; rows: CountResult}; unitLabel: string }` |
| `CountsToDim` | `{ stitchCount: number; rowCount: number; onStitchCountChange(n): void; onRowCountChange(n): void; result: {width: number; length: number}; unitLabel: string }` |
| `PatternRescale` | `{ patternGaugeStitches; patternGaugeRows; patternSwatchWidth; patternSwatchHeight; patternCount; on*Change(n) 5종; result: {stitches: CountResult; rows: CountResult}; unitLabel: string }` |
| `SavedProjects` | `{ projects: Array<{name; gauge}>; onSave(name: string): void; onApply(name: string): void; onRemove(name: string): void }` |

숫자 입력 규칙(전 컴포넌트): **draft 문자열 로컬 state에 바인딩**(committed 값 직바인딩 금지 — 타이핑 유실), 유효한 양수 파싱 시에만 on*Change 커밋, 무효/빈 값은 인라인 에러 + 마지막 유효값 유지. `inputmode="decimal"`, `<label htmlFor>` 연결(getByLabelText 통과 필수).

## 4. i18n
`tools.knitting-gauge.*` 62키가 ko/en에 이미 존재(작성 금지·소비만). 네임스페이스 구조: `title, description, meta, eyebrow, lead, modes.*, fields.*, units.*, results.*, actions.*, projects.*, errors.*, howTo.{title,items[]}, faq.{title,items[{q,a}]}`. **키를 지어내지 마라** — 사용 전 `src/i18n/messages/ko.json`에서 실키 확인. 숫자 포맷은 `useLocale()` → `Intl.NumberFormat`.
