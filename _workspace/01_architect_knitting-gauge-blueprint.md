# 뜨개질 게이지 계산기 구현 청사진

**팀**: architect(당신) → domain-engineer → ui-engineer(×2) ∥ platform-engineer → seo-geo-engineer → qa-integration  
**기한**: 단계별(SPEC 요구사항 참조)  
**참조 형제**: `src/lib/unit-converter/` + `src/components/tools/unit-converter/`(같은 interacting-utility 패턴, 다만 카테고리 탭은 없음)

---

## 1. 계층 분해 (Clean Architecture 4 계층)

### 도메인 계층 (lib/knitting-gauge/):
순수 함수, React/Next 금지, 100% 단위 테스트 가능

| 모듈 | 책임 | 공개 API 시그니처 |
|------|------|------------------|
| `schema.ts` | zod 타입 검증 | `GaugeSchema`, `StoreSchema`, `STORE_VERSION` |
| `units.ts` | cm ↔ inch 변환 (exact 2.54) | `cmToIn(cm: number): number`, `inToCm(in: number): number` |
| `gauge.ts` | 핵심 게이지 연산 | `stitchesPerUnit(sts: number, width: number): number` `rowsPerUnit(rows: number, height: number): number` `stitchesFor(width: number, perUnit: number): number` `rowsFor(length: number, perUnit: number): number` `dimensionFor(count: number, perUnit: number): number` `rescale(count: number, fromPerUnit: number, toPerUnit: number): number` `withActual(target: number, perUnit: number): { value: number; rounded: number; actual: number; delta: number }` |
| `store.ts` | localStorage 불변 연산 | `saveProject(name: string, gauge: Gauge): Store` `removeProject(name: string): Store` `pushRecent(gauge: Gauge): Store` `pruneInvalid(store: Store): Store` `serializeStore(store: Store): string` `deserializeStore(json: string): Store` |

### 유스케이스 / 어댑터 계층:
React 훅(상태/부수효과), 컴포넌트(UI), 라우팅

| 계층 | 파일 | 책임 |
|------|------|------|
| **Hook** | `useKnittingGauge.ts` | useState(gauge/mode/unit), localStorage 초기화 + 디바운스 저장, 각 모드별 파생 계산, projects/recents + apply/remove/save 메서드 |
| **Orchestrator** | `KnittingGauge.tsx` | "use client"; useKnittingGauge 소유, 자식 컴포넌트 배선, state 전달, 모드 전환 |
| **Input** | `GaugeInput.tsx` | stitches/rows/swatchW/swatchH 입력, unit 토글(cm/inch), 선택 needle/yarn note, labeled inputs, 분할 고정폭 필드 |
| **Navigation** | `ModeTabs.tsx` | role=tablist, 3가지 탭(Dimensions→counts / counts→Dimensions / Pattern rescale), aria-selected, ArrowLeft/Right, 선택 모드 상태는 부모 state |
| **Mode 1** | `DimToCounts.tsx` | width/length 입력 → cast-on stitches + rows 출력(ResultCard), rounded+exact+actual±delta |
| **Mode 2** | `CountsToDim.tsx` | stitch/row counts 입력 → finished width/length 출력, 현재 unit 에 맞춰 표시 |
| **Mode 3** | `PatternRescale.tsx` | pattern gauge(sts/rows per unit) + pattern count → your count 출력, 비율 설명 |
| **Result** | `ResultCard.tsx` | rounded 큰 숫자 표시, exact fractional 보조 표시, "실제 크기 Xcm (목표 대비 +Y)" 표시, 복사 버튼 |
| **Projects** | `SavedProjects.tsx` | localStorage 프로젝트 목록(apply/delete), "스웨터 앞판" 같은 이름 저장 |
| **SEO (gate-free)** | `KnittingGaugeIntro.tsx` | H1 + lead (="게이지(10cm 안의 코·단 수)만..."), eyebrow |
| **SEO (gate-free)** | `KnittingGaugeHowTo.tsx` | howTo.title + howTo.items[]([])의 정제 문단 배열, NO raw markdown |
| **SEO (gate-free)** | `KnittingGaugeFaq.tsx` | Faq 단일 소유(FAQPage JSON-LD), 가시 faq.items 렌더 |
| **SEO (gate-free)** | SEO helper(라우트서 호출) | SoftwareApplication JSON-LD (StructuredData 소유), url==canonical |

### 프레임워크 계층:
Next.js App Router, routes + generateMetadata 분기, registry

| 위치 | 책임 |
|------|------|
| `src/tools/registry.ts` | ToolMeta 항목 추가(id/slug/category/icon/accent/status/order/keywords) |
| `src/app/[locale]/tools/[slug]/page.tsx` | slug="knitting-gauge" 분기, `<KnittingGauge/>` 마운트, `generateMetadata` 호출 |
| `src/i18n/messages/{ko,en}.json` | tools.knitting-gauge.* 키 (title/description/modes/fields/units/results/howTo/faq) |
| `src/app/sitemap.ts` | 자동 포함(registry getLiveTools에서 파생) — 싱글 페이지이므로 스포크 루프 없음 |
| `public/llms.txt` | /tools/knitting-gauge 항목 등재 |

---

## 2. 불변식 (반드시 지킬 규칙)

### 수학적 정확성:
- **정확한 변환**: IN_TO_CM = 2.54(exact, ÷나누기 금지)
- **분할 영점 방지**: swatch width/height > 0(zod positive), 오류 시 inline 메시지 + 중립 결과(NaN/Infinity 미노출)
- **결과 라운딩**: stitches/rows은 Math.round(정수), 하지만 다음을 함께 표시:
  - `exact`: 정확한 소수점(예: 69.3)
  - `rounded`: 정수(예: 69)
  - `actual`: 그 정수가 실제 만드는 크기(예: 32.86cm)
  - `delta`: actual - target(예: -0.14cm)

### 게이지 의미 보존:
- 단위 전환(cm↔inch) 후에도 게이지 비율은 불변: `22 sts/10cm` = `22 sts/4in`(바뀌지 않음)
- swatchW/swatchH의 기본값: 10cm 또는 4in (unit toggle 시 바뀜)

### 필수 고정 치 테스트 시나리오 (SPEC 참조):
```
Test 1: Gauge 22 sts / 30 rows per 10cm → target 50cm × 30cm
  Expected: 110 sts, 90 rows (exact shown; actual size for rounded shown)

Test 2: Non-integer (21 sts → want 33cm → 69.3 → 69 sts, actual 32.86cm, delta −0.14cm)

Test 3: Pattern rescale (pattern gauge 20 sts/10cm, "cast on 100" = 50cm; 
        your gauge 22/10cm → 110 sts for same 50cm)

Test 4: Inch conversion (100 sts at 22/10cm = 45.45cm; toggle inch → same meaning in inches, 2.54 exact)

Test 5: Edge cases (swatch size 0 / empty → guarded, no NaN; projects persist on reload)
```

### 상태 저장소 불변성:
- saveProject / removeProject / pushRecent는 **새 Store 반환**(기존 객체 무변경)
- localStorage 저장 실패(quota/private) → in-memory fallback(도구는 계속 작동)

---

## 3. i18n 키 계약 (**{key, ko, en} 분리 필드**)

> **중요**: 파이프(|) 조인 금지. ko.json에는 한국어만, en.json에는 영어만 작성.

### 최상위 (필수):
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.title` | 뜨개질 게이지 계산기 | Knitting Gauge Calculator |
| `tools.knitting-gauge.description` | 게이지에서 필요한 코·단 수, 패턴 환산을 계산합니다 | Calculate cast-on stitches/rows from your gauge and rescale patterns |

### 모드 레이블:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.modes.dimToCounts` | 크기 → 코·단 수 | Dimensions → Stitches/Rows |
| `tools.knitting-gauge.modes.countsToDim` | 코·단 수 → 크기 | Stitches/Rows → Dimensions |
| `tools.knitting-gauge.modes.patternRescale` | 패턴 환산 | Pattern Rescale |

### 필드 레이블:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.fields.stitches` | 코 수 | Stitches |
| `tools.knitting-gauge.fields.rows` | 단 수 | Rows |
| `tools.knitting-gauge.fields.swatchWidth` | 니트폭 | Swatch Width |
| `tools.knitting-gauge.fields.swatchHeight` | 니트높이 | Swatch Height |
| `tools.knitting-gauge.fields.needle` | 바늘 크기 (선택사항) | Needle Size (optional) |
| `tools.knitting-gauge.fields.yarn` | 실 굵기 (선택사항) | Yarn Weight (optional) |
| `tools.knitting-gauge.fields.targetWidth` | 원하는 폭 | Target Width |
| `tools.knitting-gauge.fields.targetLength` | 원하는 길이 | Target Length |
| `tools.knitting-gauge.fields.width` | 폭 | Width |
| `tools.knitting-gauge.fields.length` | 길이 | Length |
| `tools.knitting-gauge.fields.stitchCount` | 코 수 | Stitch Count |
| `tools.knitting-gauge.fields.rowCount` | 단 수 | Row Count |
| `tools.knitting-gauge.fields.patternGauge` | 패턴 게이지 | Pattern Gauge |
| `tools.knitting-gauge.fields.patternCount` | 패턴 코·단 수 | Pattern Count |
| `tools.knitting-gauge.fields.yourGauge` | 내 게이지 | Your Gauge |

### 단위 레이블:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.units.cm` | cm | cm |
| `tools.knitting-gauge.units.inch` | 인치 | inch |

### 결과 레이블:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.results.castOnStitches` | 코 수 | Cast-On Stitches |
| `tools.knitting-gauge.results.rows` | 단 수 | Rows |
| `tools.knitting-gauge.results.exact` | 정확한 값 | Exact |
| `tools.knitting-gauge.results.actual` | 실제 크기 | Actual Size |
| `tools.knitting-gauge.results.difference` | 목표 대비 | vs Target |
| `tools.knitting-gauge.results.rescaledCount` | 내 게이지의 코·단 수 | Count for Your Gauge |
| `tools.knitting-gauge.results.ratio` | 비율 | Ratio |

### 액션 레이블:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.actions.copy` | 복사 | Copy |
| `tools.knitting-gauge.actions.copied` | 복사됨 | Copied |
| `tools.knitting-gauge.actions.save` | 저장 | Save |
| `tools.knitting-gauge.actions.apply` | 적용 | Apply |
| `tools.knitting-gauge.actions.delete` | 삭제 | Delete |
| `tools.knitting-gauge.actions.clear` | 초기화 | Clear |

### 저장된 프로젝트:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.projects.title` | 저장된 게이지 | Saved Gauges |
| `tools.knitting-gauge.projects.placeholder` | 게이지 이름 입력 | Enter gauge name |
| `tools.knitting-gauge.projects.empty` | 저장된 게이지가 없습니다 | No saved gauges |
| `tools.knitting-gauge.projects.max` | 최대 50개까지 저장 가능 | Up to 50 gauges |

### 검증 / 오류:
| key | ko | en |
|-----|----|----|
| `tools.knitting-gauge.errors.invalidInput` | 양수를 입력해주세요 | Please enter positive numbers |
| `tools.knitting-gauge.errors.swatchTooSmall` | 니트 크기는 0보다 커야 합니다 | Swatch size must be greater than 0 |
| `tools.knitting-gauge.errors.storage` | 저장 실패 | Storage error |

### howTo (정제 문단 배열):
```typescript
// i18n 구조 (ko.json / en.json)
"tools.knitting-gauge.howTo": {
  "title": "게이지를 잰다는 것은",  // "What is Gauge",
  "items": [
    "니트 게이지는 일정한 길이(보통 10cm)에 몇 개의 코와 단이 들어가는지를 나타냅니다.",
    "당신이 만들고 싶은 크기가 정해지면, 이 게이지를 사용해 필요한 코 수와 단 수를 계산할 수 있습니다.",
    "다른 게이지로 쓰여진 패턴이 있다면, 당신의 게이지에 맞게 그 패턴을 환산할 수 있습니다.",
    "이 계산기는 그 모든 과정을 자동으로 해줍니다."
  ]
}
```

### FAQ (faq.items 배열 with q/a):
```typescript
"tools.knitting-gauge.faq": {
  "title": "자주 묻는 질문",  // "FAQ",
  "items": [
    {
      "q": "게이지를 재는 방법은?",
      "a": "자신의 실과 바늘로 10cm × 10cm(또는 4in × 4in) 정도의 작은 니트(스웨치)를 만듭니다. 그 안에 몇 개의 코와 단이 있는지 세면 됩니다."
    },
    {
      "q": "왜 게이지가 중요한가요?",
      "a": "게이지가 다르면 완성된 물건의 크기가 완전히 달라집니다. 같은 코 수라도 가는 실로 하면 작아지고, 굵은 실로 하면 커집니다."
    },
    {
      "q": "cm와 인치를 섞어 쓸 수 있나요?",
      "a": "네, 이 계산기는 자동으로 환산합니다. 단위 토글을 사용해 원하는 단위로 쉽게 바꿀 수 있습니다."
    },
    {
      "q": "저장된 게이지는 언제 사라지나요?",
      "a": "브라우저의 저장소에 저장되므로, 브라우저 데이터를 삭제하거나 시크릿 모드를 사용하면 사라집니다."
    },
    {
      "q": "다른 게이지의 패턴을 내 게이지로 변환하려면?",
      "a": "'패턴 환산' 탭을 선택합니다. 패턴의 게이지(패턴이 기재된 게이지)와 코 수를 입력하면, 당신의 게이지에서 필요한 코 수가 계산됩니다."
    }
  ]
}
```

---

## 4. Registry 항목

```typescript
// src/tools/registry.ts에 추가
{
  id: 'knitting-gauge',
  slug: 'knitting-gauge',
  category: 'calculator',
  icon: 'Ruler',
  accent: 'sun',
  status: 'coming_soon',  // 'live' on launch
  isNew: true,
  order: 30,  // 현재 최대값 29 다음
  keywords: [
    '뜨개질', '게이지', '코수', '단수', '대바늘', '코바늘', '니트', '스웨치',
    '패턴환산', '크로셰', '뜨개질계산', '코밀도', '단밀도',
    'knitting', 'gauge', 'stitches', 'rows', 'swatch', 'cast on',
    'crochet', 'pattern', 'rescale', 'finished size', 'yarn'
  ],
},
```

---

## 5. 작업 분배와 빌드 순서

### 단계 1: 도메인 (domain-engineer) — 병렬 불가
**의존성**: 없음  
**산출**: lib/knitting-gauge/{schema,units,gauge,store}.ts + 테스트 (≥90% 커버리지)

1. **schema.ts** — zod GaugeSchema(stitches/rows/swatchW/swatchH/unit/"cm"|"inch", 선택 needle/yarn), StoreSchema(version/projects/recents/meta), STORE_VERSION=1
   - Gauge는 `{stitches: positive(), rows: positive(), swatchW: positive(), swatchH: positive(), unit: union("cm","inch"), note?: string}`
   - Store는 `{version: number, projects: Array<{name, gauge}>, recents: Array<Gauge>, meta: {createdAt}}`

2. **units.ts** — cmToIn/inToCm (×÷ 2.54), toBaseCm(value, unit), fromBaseCm(baseCmValue, targetUnit)
   - 모든 내부 계산은 cm 기반(정규화)
   - 테스트: 1in = 2.54cm exact, 왕복 ±0.00001

3. **gauge.ts** — 핵심 연산 함수들(명시 시그니처 위 참조)
   - stitchesPerUnit / rowsPerUnit = count / width (in 현재 unit)
   - stitchesFor / rowsFor = target × perUnit
   - dimensionFor = count / perUnit
   - rescale = count × (toPerUnit / fromPerUnit)
   - withActual = {value (exact), rounded (Math.round), actual (dimensionFor(rounded, perUnit)), delta (actual - target)}
   - 테스트: 4가지 시나리오 + non-integer + inch + divide-by-zero guard

4. **store.ts** — localStorage 불변 연산들
   - saveProject(store, name, gauge) → newStore (projects 배열에 추가, name 중복 시 덮어쓰기)
   - removeProject(store, name) → newStore
   - pushRecent(store, gauge) → newStore (recents MRU, max 10, 중복 제거)
   - pruneInvalid(store) → newStore (zod parse fail 항목 제거)
   - serializeStore / deserializeStore (JSON ↔ Store)
   - 테스트: 불변성(원본 변경 없음), edge(빈 배열, max초과, corrupt JSON)

**합격 기준**: vitest 모든 테스트 PASS, 도메인 커버리지 ≥90%, tsc 0 errors

---

### 단계 2A: i18n 키 확정 (platform-engineer) — 병렬 가능 (domain과)

**의존성**: 청사진의 키 계약 (이미 정의됨)  
**산출**: src/i18n/messages/{ko,en}.json에 tools.knitting-gauge.* 키 모두 추가

- ko.json: tools.knitting-gauge.* (모든 한국어 값)
- en.json: tools.knitting-gauge.* (모든 영어 값)
- 각 값은 **locale-aware 문자열**(하드코딩 한글/영어 X)
- Test-utils에 ko/en 카탈로그 fixture 추가

**합격 기준**: ko/en JSON 모두 유효, src/__test__/test-utils.tsx에 carryover, linter 통과

---

### 단계 2B: Hook 작성 (domain-engineer 계속) — 병렬 가능

**의존성**: lib/knitting-gauge/* 완료 + i18n 키 추가  
**산출**: useKnittingGauge.ts + tests (≥85% 커버리지)

```typescript
export function useKnittingGauge() {
  const [gauge, setGauge] = useState<Gauge>({stitches: 22, rows: 30, swatchW: 10, swatchH: 10, unit: 'cm'})
  const [mode, setMode] = useState<'dimToCounts' | 'countsToDim' | 'patternRescale'>('dimToCounts')
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm')
  const [projects, setProjects] = useState<Array<{name: string; gauge: Gauge}>>([])
  const [recents, setRecents] = useState<Gauge[]>([])
  
  // Mount: read localStorage, parse zod, prune invalid, fallback in-memory
  useEffect(() => {
    try {
      const json = localStorage.getItem('jurepi-knitting-gauge')
      const store = json ? deserializeStore(json) : initialStore()
      setProjects(store.projects)
      setRecents(store.recents)
    } catch {
      // in-memory only
    }
  }, [])
  
  // Debounced save (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const store = {version: STORE_VERSION, projects, recents, meta: {createdAt: Date.now()}}
        localStorage.setItem('jurepi-knitting-gauge', serializeStore(store))
      } catch {
        // quota/private — fallback in-memory (도구는 계속 작동)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [projects, recents])
  
  // Derived results per mode
  const dimToCountsResult = {
    stitches: stitchesFor(targetWidth, stitchesPerUnit(gauge, unit)),
    rows: rowsFor(targetLength, rowsPerUnit(gauge, unit)),
    // with actual ± delta
  }
  
  // Action methods
  const saveProject = (name) => setProjects(store.saveProject(name, gauge))
  const applyProject = (name) => { const p = projects.find(p => p.name === name); if(p) setGauge(p.gauge) }
  const removeProject = (name) => setProjects(store.removeProject(name))
  
  return {gauge, setGauge, mode, setMode, unit, setUnit, projects, recents, saveProject, applyProject, removeProject, dimToCountsResult, ...}
}
```

- **중요**: 디바운스 콜백은 로컬 변수로 값 전달(stale 클로저 방지)
- **중요**: discrete 상태(projects/recents) 추가/삭제 시 즉시 save(디바운스 금지)
- localStorage 실패 시 in-memory fallback, 도구는 계속 작동
- 단위 토글: gauge 의미는 보존, swatchW/swatchH 기본값만 변경

**합격 기준**: 95/100 컴포넌트 테스트 PASS, 스톨 클로저 없음, localStorage 에러 경로 검증

---

### 단계 3A: UI 컴포넌트 작성 (ui-engineer ×2, 병렬)

**의존성**: domain(gauge.ts 등), useKnittingGauge, i18n  
**산출**: src/components/tools/knitting-gauge/{GaugeInput,ModeTabs,DimToCounts,CountsToDim,PatternRescale,ResultCard,SavedProjects}.tsx + tests

#### ui-engineer #1:
- **GaugeInput.tsx** — stitches/rows/swatchW/swatchH 입력, unit toggle, needle/yarn note
  - labeled inputs (inputmode="decimal"), 20px padding, surface-muted 배경
  - unit toggle: 버튼 또는 pill(cm/inch), toggle 시 기본값 갱신(10cm↔4in)
  - 검증: 양수만(zod), 오류 시 inline message
  - 테스트: 모든 필드 label 매칭, unit toggle 동작, 오류 표시

- **ModeTabs.tsx** — role=tablist, 3가지 탭 ("크기→코·단수" / "코·단수→크기" / "패턴환산")
  - ArrowLeft/Right 네비게이션, aria-selected, 활성 탭 밑줄(sun accent)
  - 테스트: tab 선택 변경, 키보드 네비게이션, 탭 수 3개

- **ResultCard.tsx** — rounded 큰 숫자, exact 보조값, actual ± delta, 복사 버튼
  - 레이아웃: rounded 36px 폰트/700, exact 14px muted, "실제 크기 Xcm (목표 대비 +Y)" 14px
  - 복사: summary 텍스트(예: "110 sts, 90 rows (정확한 값: 110, 90)")
  - aria-live="polite" (결과 갱신 알림)
  - 테스트: 숫자 국지화(Intl), 복사 버튼 이벤트, en에 한글 누수 없음

#### ui-engineer #2:
- **DimToCounts.tsx** — targetWidth/targetLength 입력 → 2개의 ResultCard (cast-on stitches + rows)
  - 각 ResultCard: rounded/exact/actual±delta
  - 테스트: 22sts/10cm, 50cm×30cm → 110sts, 90rows

- **CountsToDim.tsx** — stitch/row counts 입력 → finished width/length 출력(text, no ResultCard)
  - 테스트: 100sts at 22/10cm → 45.45cm

- **PatternRescale.tsx** — patternGauge(sts/rows per unit) + patternCount → yourCount
  - "패턴이 X 게이지로 Y 코라면, 당신의 게이지(Z)에서는 W 코가 필요합니다" 설명 포함
  - 테스트: 패턴 20sts/10cm "cast on 100", 당신 22/10cm → 110sts

- **SavedProjects.tsx** — 저장된 게이지 목록(apply/delete), "스웨터 앞판" 같은 이름 저장
  - Input 필드 + 저장 버튼, 프로젝트 리스트(각 항목에 apply/delete 버튼)
  - max 50개, 만원 시 안내 메시지
  - 테스트: 저장/적용/삭제, 빈 목록, max초과

**UI 합격 기준**:
- 개별 테스트 ≥80% (모든 필드 interaction 검증)
- 레이블 모두 getByLabelText 통과
- en 로케일에 한글 누수 grep 0개
- 320/768/1024 responsive 검증(no overflow)

---

### 단계 3B: Platform 라우트 배선 (platform-engineer) — 병렬 3A와

**의존성**: i18n 키 확정, useKnittingGauge  
**산출**: src/app/[locale]/tools/[slug]/page.tsx 분기 + generateMetadata 분기 + registry 정정

1. slug === 'knitting-gauge' 분기 추가:
   ```tsx
   if(slug === 'knitting-gauge') {
     return <KnittingGauge />
   }
   ```

2. generateMetadata 분기:
   ```ts
   if(slug === 'knitting-gauge') {
     const title = t('tools.knitting-gauge.title')
     const description = t('tools.knitting-gauge.description')
     return buildToolEntityMetadata(locale, 'knitting-gauge', title, description)
   }
   ```

3. src/tools/registry.ts 업데이트(위 "4. Registry 항목" 참조)

4. generateStaticParams: 'knitting-gauge' ∈ getLiveTools() 확인

**합격 기준**: ko/en 라우트 200, getServerSideProps/ISR 미사용, SSG prefetch, 표준 404

---

### 단계 3C: SEO 섹션 작성 (seo-geo-engineer) — 병렬

**의존성**: i18n(howTo/faq 키), lib/seo.ts(absoluteToolUrl, buildToolEntityMetadata, faqPageJsonLd)  
**산출**: KnittingGaugeIntro/HowTo/Faq + SEO JSON-LD (gate-free SSR)

1. **KnittingGaugeIntro.tsx** (Server Component, gate-free SSR):
   ```tsx
   export default function KnittingGaugeIntro() {
     return (
       <section>
         <p className="eyebrow">{t('tools.calculator')}</p>
         <h1>{t('tools.knitting-gauge.title')}</h1>
         <p className="lead">{t('tools.knitting-gauge.description')}</p>
       </section>
     )
   }
   ```

2. **KnittingGaugeHowTo.tsx** (Server Component, gate-free SSR):
   - howTo.title + howTo.items[] (정제 문단 배열 렌더, 원시 markdown 금지)
   - No `<h2>##</h2>`, just `<p>{item}</p>`

3. **KnittingGaugeFaq.tsx** (dynamic import 가능):
   - Faq 단일 소유(FAQPage JSON-LD)
   - 가시 faq.items[] (q/a) 렌더
   - FAQPage 스키마: 정확히 1개, url==canonical

4. **라우트서 호출** (StructuredData는 라우트서):
   ```tsx
   <script type="application/ld+json" dangerouslySetInnerHTML={{
     __html: JSON.stringify(softwareApplicationJsonLd('knitting-gauge', locale, t))
   }} />
   ```

**합격 기준**:
- 프리렌더 HTML에서 Intro/HowTo/Faq 전부 보이기(mount 게이트 밖)
- FAQPage JSON-LD 정확히 1개 (Faq 소유)
- SoftwareApplication JSON-LD url==canonical
- en에서 한글 누수 없음

---

### 단계 4: E2E 테스트 (qa-integration)

**의존성**: 모든 UI + 라우트 완료  
**산출**: tests/e2e/knitting-gauge.spec.ts (≥5 시나리오)

```typescript
// 시나리오 1: Dimensions → counts
test('calculates cast-on stitches and rows from target dimensions', async ({page}) => {
  await page.goto('/ko/tools/knitting-gauge')
  // Enter gauge 22 sts / 30 rows per 10cm
  await page.fill('[aria-label="코 수"]', '22')
  await page.fill('[aria-label="단 수"]', '30')
  // Mode: Dimensions → counts
  await page.click('button[role="tab"]:has-text("크기 → 코·단 수")')
  // Target 50cm × 30cm
  await page.fill('[aria-label="원하는 폭"]', '50')
  await page.fill('[aria-label="원하는 길이"]', '30')
  // Check result
  await expect(page.locator('text=110')).toBeVisible()  // rounded
  await expect(page.locator('text=정확한 값')).toBeVisible()  // exact label
})

// 시나리오 2: Unit toggle
test('converts dimensions and gauge when toggling units', async ({page}) => {
  await page.goto('/en/tools/knitting-gauge')
  await page.fill('[aria-label="Stitches"]', '22')
  await page.fill('[aria-label="Swatch Width"]', '10')
  await page.click('button:has-text("inch")')
  // Swatch default should change to 4in, meaning preserved
})

// 시나리오 3: Pattern rescale
test('rescales pattern count from pattern gauge to user gauge', async ({page}) => {
  await page.goto('/ko/tools/knitting-gauge')
  // Set user gauge 22/10cm
  await page.fill('[aria-label="코 수"]', '22')
  // Click Pattern rescale tab
  await page.click('button[role="tab"]:has-text("패턴 환산")')
  // Pattern gauge 20 sts/10cm, count 100
  await page.fill('[aria-label="패턴 게이지"]', '20')
  await page.fill('[aria-label="패턴 코·단 수"]', '100')
  // Result: 110
  await expect(page.locator('text=110')).toBeVisible()
})

// 시나리오 4: Save & apply project
test('saves and applies saved gauge', async ({page}) => {
  await page.goto('/ko/tools/knitting-gauge')
  await page.fill('[aria-label="코 수"]', '24')
  await page.fill('[aria-label="단 수"]', '32')
  // Save as "스웨터 앞판"
  await page.fill('[aria-label="게이지 이름 입력"]', '스웨터 앞판')
  await page.click('button:has-text("저장")')
  // Reload
  await page.reload()
  // Apply
  await page.click('button:has-text("스웨터 앞판")')
  await expect(page.locator('[aria-label="코 수"]')).toHaveValue('24')
})

// 시나리오 5: Copy result
test('copies result to clipboard', async ({page}) => {
  await page.goto('/ko/tools/knitting-gauge')
  await page.fill('[aria-label="코 수"]', '22')
  // Get clipboard text
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  // Verify contains number
  expect(clipboard).toMatch(/110|정확한|목표/)
})
```

**합격 기준**:
- 5 시나리오 모두 PASS
- 한글/영어 로케일 각 1회 테스트
- pageerror 하드게이트(콘솔 에러 0개)
- E2E 환경 위생: :3000 serve 검증, localStorage jsdom 격리

---

## 6. SEO/GEO 명세

### Metadata:
- **canonical**: `https://apps.jurepi.kr/[locale]/tools/knitting-gauge` (locale-specific hreflang)
- **og:title / og:description**: registry 정보 미러
- **og:image**: /images/og-tools-default.png (또는 도구별 이미지)

### Structured Data (gate-free SSR, prerender):
1. **SoftwareApplication** (라우트에서 StructuredData 소유):
   ```json
   {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "뜨개질 게이지 계산기",
     "description": "...",
     "url": "https://apps.jurepi.kr/ko/tools/knitting-gauge",
     "applicationCategory": "Productivity",
     "offers": {
       "@type": "Offer",
       "price": "0"
     }
   }
   ```

2. **FAQPage** (Faq 컴포넌트 단일 소유, 가시 faq.items 기반):
   ```json
   {
     "@context": "https://schema.org",
     "@type": "FAQPage",
     "mainEntity": [
       {
         "@type": "Question",
         "name": "게이지를 재는 방법은?",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "..."
         }
       },
       ...
     ]
   }
   ```

### llms.txt:
```
# /tools/knitting-gauge
뜨개일 게이지 계산기 — 게이지에서 필요한 코 수, 단 수, 패턴 환산을 계산합니다.
계산 가능: 크기 → 코·단 수 / 코·단 수 → 크기 / 패턴 환산
단위: cm, 인치 (2.54 정확 변환)
로컬 스토리지에 게이지 저장, 최대 50개 프로젝트

https://apps.jurepi.kr/ko/tools/knitting-gauge
```

### Sitemap:
자동 포함(registry getLiveTools 파생, 싱글 페이지이므로 spoke loop 없음)

---

## 7. 함정 및 주의사항 (하네스 지식)

### 코딩 표준:
1. **스테일 클로저 금지**: useEffect 안의 콜백이 마운트 시점의 state를 캡처하지 않도록 주의(특히 저장 타이머)
2. **디바운스 콜백은 값을 인자로 전달**: ref 스냅샷이 아니라 로컬 변수
3. **discrete 상태 즉시 persist**: projects/recents 추가/삭제는 debounce 없이 즉시 localStorage 쓰기
4. **팬텀 토큰 금지**: globals.css의 실토큰만 사용(`accent-sun`, `surface-muted` 등), 존재 안 하는 `var(--semantic-*)`나 `bg-surface-hover` 금지

### 테스트:
1. **단위 테스트 fixture**: SPEC의 4가지 시나리오 + non-integer + inch + divide-by-zero edge case
2. **컴포넌트 테스트**: 실제 i18n 카탈로그(모의 금지), getByLabelText로 label 연결 검증, localStorage jsdom 격리
3. **E2E**: webServer는 `serve out`(정적 export), reuseExistingServer: true, pageerror 0개 하드게이트, 콘솔 영어 누수 없음

### i18n:
- 분리: ko.json에는 한국어만, en.json에는 영어만
- 최상위 title/description 필수
- howTo/faq.items는 정제 **문단 배열**([]) — 원시 markdown(##, **) 금지
- 모든 사람대상 문자열은 t() 경유(선택 dropdown도 t() 래핑)
- en에서 한글 누수 grep: `/[가-힣]/` 스캔, `/^tools\./` 로케일 포맷 확인

### 레이아웃:
- 320px 무overflow: 모든 숫자는 break-all, 버튼 full-width 모바일
- result 큰 숫자: tabular-nums 폰트(숫자 정렬)
- 단위 토글은 여러 곳에서 보이지만 **state는 한 곳**(부모 state, 하위 자식은 prop)

### 배포:
- status: coming_soon → live (사용자 승인 후)
- order: 30 (현재 최대값 다음)
- accent: 'sun' (registry 미리 확정)
- icon: 'Ruler' (lucide-react)

---

## 작업 순서 요약

```
[병렬불가]
1. domain: lib/knitting-gauge/{schema,units,gauge,store}.ts (Vitest, 90%+)

[병렬가능]
├─ 2a. platform: i18n ko/en keys + test-utils
├─ 2b. domain: useKnittingGauge hook (85%+)
└─ 3a. ui×2: 7개 컴포넌트 (80%+ each) + 병렬 platform route 배선
       + 병렬 seo-geo: KnittingGaugeIntro/HowTo/Faq + StructuredData

[최종]
4. qa: E2E 5시나리오 (모든 경로 완료 후)
5. 리더 게이트: 시각·콘솔·E2E·프리렌더·라이브 검증 후 배포

배포: git push origin calculator/knitting-gauge:main → CF 자동
```

---

## 참조 자료

- **SPEC**: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-knitting-gauge/docs/services/calculator/knitting-gauge/SPEC.md`
- **DESIGN**: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-knitting-gauge/docs/DESIGN.md`
- **형제 도구**: unit-converter (lib/unit-converter/, components/tools/unit-converter/)
- **하네스**: CLAUDE.md의 "함정" 섹션 + 최근 도구 세션(장황한 적발 목록)
