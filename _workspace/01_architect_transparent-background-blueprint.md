# Transparent Background Maker — 아키텍처 청사진

**상태**: 설계 단계 (domain-engineer 착수 대기)  
**요구사항 정본**: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/docs/services/converter/transparent-background/SPEC.md`  
**시각 정본**: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/docs/DESIGN.md` (sky accent, converter category)  
**출발점**: qr-code 형제 도구(lib/schema + useQRCode 훅 + 컴포넌트 구조)

---

## 1. 클린 아키텍처 4계층 분해

### 의존성 규칙
- **도메인** ← (없음, 순수 함수, 표준 라이브러리만)
- **유스케이스** ← 도메인
- **어댑터** (컴포넌트) ← 유스케이스 + 도메인
- **프레임워크** (라우트, i18n, registry) ← 전체 스택

### 계층별 책임

#### **도메인 계층** (`src/lib/transparent-background/`)
순수 함수, 부작용 없음. React/Next import 절대 금지. ImageData는 표준 타입이므로 사용 가능.

| 파일 | 공개 API | 책임 | 테스트 |
|------|---------|------|--------|
| `schema.ts` | `ImageLoadOptions`, `RemovalOptions`, `RemovalResult`, `ProcessingState` (zod) | 입출력 타입, 상수 (DOWNSCALE_THRESHOLD=4096, TOLERANCE_MAX_DISTANCE=85, etc.) | `schema.test.ts` (parse/validate) |
| `color-distance.ts` | `euclideanDistance(rgb1: RGB, rgb2: RGB): number` | RGB 색 거리 계산 (0–255 scale) | 단위테스트: (255,0,0)–(0,0,0)=255, (255,255,255)–(255,255,255)=0 |
| `corner-detect.ts` | `detectBackgroundColor(imageData: ImageData, insetRatio: number): RGB ∣ null` | 4코너 샘플, 히스토그램 집계, 주색 반환 | 모의 ImageData(4×4px 흰 배경): {r:255,g:255,b:255} |
| `transparency.ts` | `applyTransparency(imageData: ImageData, bgColor: RGB, tolerance: number, feather: number, mode: 'flood-fill'∣'global'): ImageData` | 핵심 제거 로직: tolerance→거리 매핑, flood-fill BFS, global 필터, feather 블렌딩, alpha 보존 | 커버리지 ≥80%: 경계 픽셀, feather 혼합, 기존 alpha 곱셈 |
| `feather.ts` | `featherAlpha(pixels: Uint8ClampedArray, indices: number[], tolerance: number, featherWidth: number): void` | 경계 픽셀 alpha 선형 보간 (in-place) | alpha 보간 곡선 검증 |
| `export.ts` | `canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob>` | canvas → PNG Blob 변환 (fallback: dataURL) | 모의 canvas, 결과 Blob 형식 검증 |
| `index.ts` | 배럴 (모든 export) | — | — |

**계약 예시**:
```typescript
// schema.ts
export const TOLERANCE_MAX_DISTANCE = 85;
export const FEATHER_MAX_PX = 20;
export const DOWNSCALE_THRESHOLD_PX = 4096;

export const removalOptionsSchema = z.object({
  bgColor: z.object({ r: z.number().int().min(0).max(255), g: z.number().int().min(0).max(255), b: z.number().int().min(0).max(255) }),
  tolerance: z.number().min(0).max(100), // 0–100 슬라이더
  feather: z.number().min(0).max(20),
  mode: z.enum(['flood-fill', 'global']).default('flood-fill'),
});

// color-distance.ts
export function euclideanDistance(rgb1: RGB, rgb2: RGB): number {
  const dr = rgb1.r - rgb2.r, dg = rgb1.g - rgb2.g, db = rgb1.b - rgb2.b;
  return Math.sqrt(dr*dr + dg*dg + db*db); // 0–~442.5 (√3×255)
}

// corner-detect.ts
export function detectBackgroundColor(imageData: ImageData, insetRatio: number = 0.05): RGB | null {
  // 4코너 5% inset 샘플 → RGB 히스토그램 → 주색 반환
  // 실패 시 null (어댑터가 흰색 기본값)
}

// transparency.ts (핵심 알고리즘)
export function applyTransparency(
  imageData: ImageData,
  bgColor: RGB,
  tolerance: number, // 0–100
  feather: number,   // 0–20
  mode: 'flood-fill' | 'global'
): ImageData {
  const maxDistance = TOLERANCE_MAX_DISTANCE * (tolerance / 100); // 0–85 매핑
  const result = new ImageData(imageData.data.slice(), imageData.width, imageData.height);
  
  if (mode === 'flood-fill') {
    // 4 코너에서 BFS, 같은색 연결영역만 제거
    const seed = detectCornerPixels(imageData, bgColor, maxDistance);
    markConnectedRegion(result, seed, bgColor, maxDistance, feather);
  } else {
    // global: tolerance 이내 모든 픽셀
    markAllMatching(result, bgColor, maxDistance, feather);
  }
  return result;
}
```

#### **유스케이스 계층** (`src/components/tools/transparent-background/useTransparencyRemover.ts`)

hook (no React Server Component). 단일 훅 소유 이미지 로드, 감지, 제거, localStorage 보존.

**계약**:
```typescript
export interface TransparencyRemoverState {
  // 입력 상태
  sourceFile: File | null;
  sourceImage: HTMLCanvasElement | null; // 원본 (다운스케일 후)
  sourceWidth: number | number | null;
  sourceHeight: number | null;
  
  // 옵션
  bgColor: RGB;
  tolerance: number; // 0–100
  feather: number;   // 0–20
  mode: 'flood-fill' | 'global';
  
  // 출력 상태
  resultCanvas: HTMLCanvasElement | null;
  resultBlob: Blob | null;
  processingTimeMs: number | null;
  
  // UI 상태
  phase: 'idle' | 'loading' | 'detecting' | 'removing' | 'done' | 'error';
  progress: number; // 0–100 (큰 이미지용)
  error: string | null;
  isDownscaled: boolean;
}

export function useTransparencyRemover(): TransparencyRemoverState & {
  uploadImage(file: File): Promise<void>;
  detectBackground(): Promise<void>;
  updateOptions(opts: Partial<RemovalOptions>): void;
  exportPNG(): Promise<Blob>;
  copyToClipboard(): Promise<void>;
  reset(): void;
}
```

**책임**:
- FileReader로 이미지 로드 → canvas 렌더 → 다운스케일 (4096px)
- `corner-detect` 호출 → `bgColor` 상태 설정
- 슬라이더 변경 시 `applyTransparency` 호출 (debounced 100ms)
- 결과 canvas 유지
- localStorage `jurepi-transparent-background` 저장/복구 (tolerance, feather, mode, lastBgColor)
- **불변식**: 훅은 early return 위에서 무조건 호출, ref 대신 반응 상태만 사용

#### **어댑터 계층** (`src/components/tools/transparent-background/`)

**Client Components** (프레젠테이션, 상태 소비). 각 컴포넌트 <200줄, 단일 책임.

| 컴포넌트 | Props | 렌더 | 테스트 |
|--------|-------|------|--------|
| `ImageUpload.tsx` | `onFileSelect: (file: File) => void`, `isDone: boolean`, `fileName?: string`, `fileSize?: string` | Dashed box, 드래그앤드롭, 파일 인풋 (accept png/jpeg/webp), 후 파일명·크기 | drag이벤트 시뮬, 파일 선택, 레이블 확인 |
| `BackgroundColorPicker.tsx` | `bgColor: RGB`, `onColorChange: (color: RGB) => void`, `onEyedropperMode: () => void`, `isLoading: boolean` | "자동 감지" 버튼, "색 가져오기" 버튼, hex 입력, 색 스왓치 (60px) | 버튼 클릭, hex 입력 onChange, 색 스왓치 렌더 |
| `EyedropperCursor.tsx` | `isActive: boolean`, `imageCanvas?: HTMLCanvasElement`, `onColorSampled: (rgb: RGB) => void`, `onCancel: () => void` | cursor: crosshair, 호버 24px 미리보기, 클릭 샘플, Esc 탈출 | hover/click 이벤트, 색 추출 검증 |
| `RemovalControls.tsx` | `tolerance: number`, `onToleranceChange: (n: number) => void`, `feather: number`, `onFeatherChange: (n: number) => void`, `mode: 'flood-fill'∣'global'`, `onModeChange: (m) => void` | 슬라이더 2개 (0–100, 0–20), 라벨, 모드 pill 버튼 2개 | 슬라이더 입력, 값 렌더, 모드 클릭 |
| `PreviewCanvas.tsx` | `resultCanvas?: HTMLCanvasElement`, `isProcessing: boolean`, `phase: ProcessingState['phase']` | canvas 렌더 (체커보드 배경), 반응 크기, 스피너 (detecting 중), 치수 라벨 | 스냅샷 테스트 (체커 패턴, canvas 렌더) |
| `ExportButton.tsx` | `resultBlob?: Blob`, `canExport: boolean`, `onDownload: () => void`, `onCopyClipboard: () => void` | "Download PNG" + "Copy" 버튼 (dual), disabled until done, 토스트 피드백 | 클릭 → 다운로드/클립보드, 활성화 상태 |
| `TransparentBgIntro.tsx` | (없음, 서버 컴포넌트) | H1 + lead (18px body-lg) | SSR 테스트 (프리렌더 HTML, useTranslations 동기) |
| `TransparentBgHowTo.tsx` | (없음) | 5–6절 장문 (색 제거 시점, flood-fill vs global, feather, etc.) | SSR, 마크다운 렌더링 검증 |
| `TransparentBgFaq.tsx` | (없음) | `<Faq>` 컴포넌트 (가시 items[] 기반 FAQPage JSON-LD) | 프리렌더 FAQPage 정확히 1개 |
| `TransparentBackgroundMaker.tsx` | (없음, "use client") | 전체 SPA 오케스트레이터: useTransparencyRemover + 서브컴 배열 | 업로드→감지→조정→다운 E2E flow |

**계약 예시**:
```typescript
// RemovalControls.tsx 내 슬라이더
<input
  type="range"
  min="0"
  max="100"
  value={tolerance}
  onChange={(e) => onToleranceChange(Number(e.target.value))}
  aria-label="Tolerance (유사도)"
  aria-valuetext={`${tolerance}%`}
/>
```

#### **프레임워크 계층** (registry, route, i18n)

| 파일 | 변경사항 | 책임 |
|------|--------|------|
| `src/tools/registry.ts` | 1 entry 추가 | 레지스트리 등재: status `coming_soon` → `live` 시 배포 |
| `src/app/[locale]/tools/[slug]/page.tsx` | slug `transparent-background` 분기 추가 | 동적 import (lazy), SEO 섹션 (Intro/HowTo/Faq/StructuredData), ShareButtons 배선 |
| `src/i18n/messages/{ko,en}.json` | `tools.transparent-background.*` 키 추가 | UI chrome + meta 국/영문 |

**registry 엔트리**:
```typescript
{
  id: 'transparent-background',
  slug: 'transparent-background',
  category: 'converter',
  icon: 'Zap', // lucide-react
  accent: 'sky', // var(--accent-sky) #38bdf8
  status: 'coming_soon', // 'live'로 전환 시 배포
  isNew: true,
  order: 22,
  keywords: ['배경제거', '투명', '배경투명', '로컬', 'remove background', 'transparent', 'single-color', 'local', 'privacy'],
},
```

---

## 2. 불변식 (Invariants) — 반드시 지켜야 할 규칙

### 도메인 순수성
1. **도메인 계층은 React/Next/DOM import 금지**. 순수 함수만. ImageData는 표준 타입이므로 `new ImageData()` 허용.
2. **모든 도메인 함수는 부작용 없음** — canvas 렌더링, localStorage, 네트워크 모두 어댑터 책임.

### 색 처리
3. **tolerance 0–100 → distance 0–85 매핑**. `maxDistance = 85 * (tolerance / 100)`.
4. **기존 alpha 보존**. 입력 PNG가 이미 투명하면 새 alpha와 곱셈: `newAlpha = oldAlpha * (if remove then 0 else 1)`.
5. **feather는 경계 픽셀만**: `if distance > tolerance - feather && distance <= tolerance: alpha = 1 - (distance - (tolerance - feather)) / feather`.

### 이미지 처리
6. **다운스케일 4096px 최장 변**. 크기 확인 후 `canvas.drawImage` 스케일링. 다운스케일됨 flag 토스트.
7. **flood-fill은 seed (4 코너)에서만 BFS**. 연결 영역만 제거. global은 모든 매칭 픽셀.
8. **큰 이미지는 청크 처리** (65k픽셀/rAF). 메인스레드 블로킹 금지 → progress 0–100.

### 훅 & 상태
9. **useTransparencyRemover는 early return 위에서 모든 훅 호출**. 조건부 훅 금지 (Rules of Hooks).
10. **반응 상태만 활성화 판별**. ref (`sourceCanvas?.current`) 사용 금지. 대신 `resultCanvas !== null`.
11. **디바운스 콜백은 스테일 클로저 금지**. 슬라이더 변경 → 값을 인자로 전달, 상태 직접 캡처 금지.

### SEO & 구조화 데이터
12. **Intro/HowTo/Faq는 mounted 게이트 밖 SSR**. `'use client'` 경계 밖 서버 컴포넌트로 먼저 렌더 → useTranslations 동기 호출.
13. **FAQPage JSON-LD는 Faq 컴포넌트 단일 소유**. StructuredData는 SoftwareApplication + BreadcrumbList만. 중복 금지.
14. **모든 사람 텍스트는 `t()`로 국/영 로케일화**. 한글 하드코딩 금지 (en 라이브 스크린샷 검증).

### 컴포넌트 & UI
15. **떠 있는 레이어(색 스왓치, preview canvas)는 명시 너비** (`max-w-[16rem]`). 스케일 토큰 금지 (spacing.md=16px conflict).
16. **시맨틱 색은 실토큰만** (danger/warning/success, 접미사 `-ink`). 팬텀 토큰 금지 (`semantic-*`, `*-soft` 상태색에 부적절).
17. **프레젠테이션 리프는 window 전역 리스너 금지**. 키보드/스크롤은 오케스트레이터(TransparentBackgroundMaker) 또는 훅 소유.
18. **ShareButtons는 라우트 템플릿 자동 배선** (도구 내 직접 배치 금지). 절대 URL prop으로 스포크 링크 공유.

---

## 3. i18n 키 계약 (전체 트리)

**네임스페이스**: `tools.transparent-background.*`

모든 UI 텍스트를 **정확히** 나열. UI/platform이 이 계약을 따를 것. 키 누락 = MISSING_MESSAGE 런타임 에러.

```json
{
  "tools": {
    "transparent-background": {
      "title": "배경 투명 만들기",
      "description": "단색 배경을 로컬에서 제거합니다. 이미지는 업로드되지 않습니다.",
      "lead": "배경 투명 만들기",
      
      "meta": {
        "title": "배경 투명 만들기 · Jurepi",
        "description": "제품 사진, 로고, 스캔본의 단색 배경을 로컬에서 빠르게 제거하세요. 100% 프라이빗, 이미지 업로드 없음."
      },
      
      "intro": {
        "eyebrow": "변환 도구",
        "title": "배경 투명 만들기",
        "lead": "단색 배경 제거 · 로컬 처리 · 이미지 업로드 안됨"
      },
      
      "upload": {
        "label": "이미지 업로드",
        "text": "클릭해서 업로드하거나 드래그하세요",
        "formats": "PNG, JPEG, WebP",
        "fileName": "파일명",
        "fileSize": "파일 크기",
        "dragActive": "파일을 여기에 놓으세요"
      },
      
      "colorPicker": {
        "label": "배경색",
        "autoDetect": "자동 감지",
        "eyedropper": "색 가져오기",
        "hexInput": "색 코드 (#RRGGBB)",
        "currentColor": "선택된 색",
        "eyedropperMode": "색 가져오기 모드 활성화",
        "hexPlaceholder": "#ffffff"
      },
      
      "controls": {
        "toleranceLabel": "유사도",
        "toleranceHelp": "얼마나 유사한 색을 제거할지 (0=정확한 색 only, 100=매우 유사한 색)",
        "toleranceValue": "유사도: {value}%",
        "featherLabel": "페더링",
        "featherHelp": "가장자리 부드러움 (0=딱딱함, 20=부드러움)",
        "featherValue": "페더링: {value}px",
        "modeLabel": "제거 모드",
        "modeFloodFill": "연결영역만",
        "modeFloodFillHelp": "배경과 연결된 영역만 제거 (객체 내부의 같은 색은 보존)",
        "modeGlobal": "전체",
        "modeGlobalHelp": "배경색과 일치하는 모든 픽셀 제거"
      },
      
      "preview": {
        "label": "미리보기",
        "detecting": "배경색을 감지하는 중…",
        "dimensions": "원본: {width}×{height} → PNG로 내보내기",
        "downscaled": "이미지가 크므로 최장 변이 4096px로 축소되었습니다"
      },
      
      "export": {
        "download": "PNG 다운로드",
        "copy": "클립보드에 복사",
        "downloadDisabled": "이미지를 업로드하고 설정한 후 다운로드할 수 있습니다",
        "downloadSuccess": "다운로드되었습니다!",
        "copySuccess": "클립보드에 복사되었습니다!",
        "downloadFail": "다운로드 실패. 다시 시도해주세요",
        "fileName": "transparent-{timestamp}.png"
      },
      
      "errors": {
        "unsupportedFormat": "PNG, JPEG, WebP 형식만 지원합니다",
        "cornerDetectFail": "배경색 감지 실패. 흰색으로 설정했습니다",
        "processingTimeout": "처리 시간 초과. 더 작은 이미지를 시도해주세요",
        "fileTooBig": "파일이 너무 큽니다",
        "invalidImage": "유효한 이미지 파일이 아닙니다"
      },
      
      "howTo": {
        "title": "사용 방법",
        "s1": "이미지 업로드",
        "s1Body": "PNG, JPEG, WebP 형식의 단색 배경 이미지를 업로드하세요.",
        "s2": "배경색 선택",
        "s2Body": "자동 감지 버튼을 누르거나, 색 가져오기로 직접 선택하세요.",
        "s3": "유사도 조정",
        "s3Body": "슬라이더로 제거할 색의 범위를 조정합니다. 낮을수록 정확함, 높을수록 관대함.",
        "s4": "페더링 선택",
        "s4Body": "가장자리 부드러움을 0–20px로 설정합니다. 값이 크면 anti-alias 효과.",
        "s5": "모드 선택",
        "s5Body": "연결영역만 제거하거나, 전체 배경색 제거를 선택합니다.",
        "s6": "다운로드",
        "s6Body": "투명 PNG로 다운로드하거나 클립보드에 복사하세요.",
        "whenToUse": "단색 배경 제거에 최적: 제품샷, 로고, 스캔본, 스크린샷. 복잡한 사진, 인물 누끼는 AI 도구를 추천합니다."
      },
      
      "faq": {
        "title": "자주 묻는 질문",
        "items": [
          {
            "q": "이미지가 업로드되나요?",
            "a": "아니오. 모든 처리는 브라우저에서 로컬로 이루어집니다. 이미지는 업로드되지 않습니다."
          },
          {
            "q": "투명 PNG 크기는 어느 정도인가요?",
            "a": "원본 크기에 따라 다릅니다. 다운스케일된 이미지(4096px 이상)의 경우 훨씬 작아집니다."
          },
          {
            "q": "연결영역 vs 전체 모드의 차이는?",
            "a": "연결영역: 배경과 닿은 같은색만 제거 (객체 내부의 같은색은 보존). 전체: 배경색과 일치하는 모든 픽셀 제거."
          },
          {
            "q": "페더링이란?",
            "a": "가장자리를 부드럽게 하는 효과입니다. 값이 크면 anti-alias로 인해 경계가 자연스러워집니다."
          },
          {
            "q": "이미 투명한 이미지는?",
            "a": "기존 투명도는 보존됩니다. 새 제거 효과와 곱해집니다."
          },
          {
            "q": "최대 이미지 크기는?",
            "a": "제한 없음. 4096px를 초과하면 자동으로 축소되어 처리 속도를 높입니다."
          }
        ]
      }
    }
  }
}
```

**영문 (`en.json`)**:
- `title`: "Transparent Background Maker"
- `description`: "Remove solid-color backgrounds locally. No upload."
- `lead`: "Make backgrounds transparent"
- `meta.title`: "Transparent Background Maker · Jurepi"
- 나머지 키는 한글→영문 번역 (같은 구조)

---

## 4. 작업 분배 & 빌드 순서 (5인 팀 병렬)

### 의존 관계
```
domain-engineer (lib/*, schema TDD) → 완료
    ↓
ui-engineer ∥ platform-engineer (컴포넌트, 라우트 배선)
    ↓
seo-geo-engineer (Intro/HowTo/Faq, JSON-LD 검증)
    ↓
qa-integration (전체 E2E 1–5, 시각 회귀, 성능)
```

### 각 역할 브리프

#### **domain-engineer** (담당: 도메인 계층 TDD)
**입력 파일**: 
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/docs/services/converter/transparent-background/SPEC.md`
- 위 청사진

**산출 파일**:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/schema.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/color-distance.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/corner-detect.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/transparency.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/feather.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/lib/transparent-background/export.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/tests/lib/transparent-background/*.test.ts`

**합격 기준**:
- Vitest ≥80% 커버리지
- `color-distance`: 5개 테스트 (0, 동일, 직교, 대각)
- `corner-detect`: 4코너 히스토그램, null fallback
- `transparency`: tolerance 매핑, feather 혼합, alpha 보존, flood-fill BFS, global 필터
- `feather`: 경계 alpha 곡선 3점 (경계 전, 중간, 후)
- `export`: blob 변환, dataURL fallback
- TypeScript 0 errors
- 각 파일 <300줄

**작업 순서**:
1. RED: schema + 테스트 타입 정의
2. GREEN: color-distance 구현
3. GREEN: corner-detect 구현
4. GREEN: transparency (핵심, 자세한 주석)
5. GREEN: feather, export
6. Refactor: 함수 추출, 테스트 정리
7. Coverage 달성, 정렬

---

#### **ui-engineer** (담당: 컴포넌트 4개, SPA 오케스트레이터)
**입력 파일**:
- domain-engineer의 모든 파일 (import 후)
- 위 청사진 (계약, i18n 키, DESIGN.md)

**산출 파일**:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/TransparentBackgroundMaker.tsx` (오케스트레이터, "use client")
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/useTransparencyRemover.ts` (훅, 상태 관리)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/{ImageUpload,BackgroundColorPicker,EyedropperCursor,RemovalControls,PreviewCanvas,ExportButton}.tsx`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/__tests__/*.test.tsx`

**합격 기준**:
- Vitest 컴포넌트 테스트 (real messages 카탈로그, NextIntlClientProvider)
- 각 컴포넌트 <200줄
- 훅: early return 위에서 모든 훅 호출, stale 클로저 금지
- 슬라이더: aria-label + aria-valuetext, 44px tap 높이
- 다운로드 버튼: 반응 상태(resultBlob) 게이팅, ref 금지
- 파일 업로드: real FileReader 테스트 (모의 File + e2e)
- TypeScript 0 errors
- i18n 키: ko/en 카탈로그에 일치 (grep 대조)

**작업 순서**:
1. useTransparencyRemover 훅 (상태, 로컬스토리지, 디바운스)
2. 각 프레젠테이션 컴포넌트 (의존성 없음 → 독립 테스트)
3. TransparentBackgroundMaker (훅 + 서브컴 배열)
4. E2E와 병렬: placeholder 스크린샷 생성

---

#### **platform-engineer** (담당: 라우트, 레지스트리, 번들)
**입력 파일**:
- 위 청사진 (registry 엔트리)
- 기존 `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/app/[locale]/tools/[slug]/page.tsx` (참고)

**산출 파일**:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/tools/registry.ts` (transparent-background 엔트리 추가)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/app/[locale]/tools/[slug]/page.tsx` (transparent-background 분기 추가 + generateMetadata)

**합격 기준**:
- registry 엔트리 정확 (id, slug, category converter, accent sky, status coming_soon → live, order 확정)
- page.tsx: dynamic import lazy, 4개 SEO 컴포넌트 import + 분기
- generateMetadata: buildToolMetadata 재사용, title/description/canonical/JSON-LD
- TypeScript 0 errors
- 번들: transparent-background 청크 <50KB (gzipped), lib 분리

**작업 순서**:
1. registry 엔트리 (영향도 최소)
2. page.tsx 분기 (ui-engineer 후, 병렬 가능)
3. generateMetadata (seo-geo 후)
4. 빌드 검증 (tsc, build 완료)

---

#### **seo-geo-engineer** (담당: 콘텐츠 계층, JSON-LD)
**입력 파일**:
- SPEC howTo/faq 섹션
- 위 청사진 (i18n 키, 불변식 12–14)
- `lib/seo.ts` 헬퍼 (buildToolMetadata, etc.)

**산출 파일**:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/TransparentBgIntro.tsx` (서버 컴포넌트, H1 + lead)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/TransparentBgHowTo.tsx` (마크다운 렌더, 롱폼, mounted 밖 SSR)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/src/components/tools/transparent-background/TransparentBgFaq.tsx` (`<Faq>` 컴포넌트, FAQPage JSON-LD 단일 소유)

**합격 기준**:
- Intro: useTranslations 동기 호출 (서버 컴포넌트), H1 body-lg, 18px lead
- HowTo: 마크다운 렌더링 (Markdown 컴포넌트 재사용), 5–6절, 1000 word+
- Faq: 6개 Q/A 가시 아이템 (i18n), FAQPage 1개 정확히 (프리렌더 HTML grep)
- 모든 사람 텍스트 `t()` 로케일화, 한글 하드코딩 0
- SEO 섹션은 mounted 게이트 밖 SSR (프리렌더 HTML에서 볼 수 있음)
- 각 파일 <150줄
- TypeScript 0 errors

**작업 순서**:
1. Intro (가장 간단)
2. HowTo (SPEC 섹션 확장)
3. Faq (i18n 키 기반)
4. StructuredData는 platform-engineer 처리 (buildToolMetadata)
5. 프리렌더 HTML 검증 (리더 게이트)

---

#### **qa-integration** (담당: E2E, 시각 회귀, 성능)
**입력 파일**:
- 모든 도구 산출 (완료 후 병렬 QA)

**산출 파일**:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/tests/e2e/transparent-background-*.spec.ts` (5개 시나리오)
- 시각 회귀 스크린샷 (320/768/1024, light/dark if available)

**합격 기준**:
- E2E 5 시나리오 (SPEC 기반)
  1. Upload white-bg image, auto-detect, adjust tolerance, download PNG
  2. Eyedropper mode: manual color selection
  3. Flood-fill vs global mode comparison
  4. Large image downscaling (notice shown)
  5. Accessibility (keyboard nav, a11y tree, reduced-motion), JSON-LD, SEO text
- Playwright webServer `serve out` (static build)
- 모든 interactive 요소 `toBeVisible` assertion
- Canvas 다운로드 Blob 검증 (mime type)
- 시각 회귀 (boundingBox width, no overflow at 320px)
- 콘솔 에러 0
- CLS <0.1 (예약 ad 높이 확인)
- LCP <2.5s

**작업 순서**:
1. E2E 1–4 작성 (SPEC 시나리오)
2. a11y 테스트 (axe, keyboard, focus-visible)
3. 시각 스크린샷 (모든 상태: empty, uploading, done, error)
4. 성능 라이트하우스 (선택)
5. 리더 라이브 게이트 (세 화면: 실제 브라우저)

---

## 5. 관례 준수 체크리스트

### 하네스 반복 결함 방지

- [ ] **훅 패턴** — useTransparencyRemover는 early return 위에서 무조건 모든 훅 호출 (조건부 훅 금지)
- [ ] **반응 상태 게이팅** — 다운로드 버튼 활성화는 `resultBlob !== null` (ref 금지)
- [ ] **디바운스 안전** — 슬라이더 onChange → 값을 인자로 전달, 상태 직접 캡처 금지 (stale 클로저)
- [ ] **SEO 게이트 밖** — Intro/HowTo/Faq는 mounted 게이트 밖 SSR (useTranslations 동기)
- [ ] **JSON-LD 단일 소유** — FAQPage는 Faq 컴포넌트만 (StructuredData는 SoftwareApplication+Breadcrumb)
- [ ] **떠 있는 레이어 너비** — 색 스왓치/preview canvas: `max-w-[16rem]` (스케일 토큰 금지)
- [ ] **시맨틱 색** — danger/warning/success만 (팬텀 `semantic-*`, `*-soft` 상태색 금지)
- [ ] **프레젠테이션 리프** — 키보드/전역 리스너 금지 (오케스트레이터/훅 소유)
- [ ] **i18n 키 대조** — ui/platform이 ko/en 카탈로그와 grep 일치 (MISSING_MESSAGE 0)
- [ ] **테스트 카탈로그** — 컴포넌트 테스트는 real NextIntlClientProvider + 실제 messages (모의 금지)
- [ ] **형제 워크트리 절대경로** — EnterWorktree로 형제 경로 고정 (상대 경로/cwd 상속 금지)
- [ ] **커밋 완전성** — git status로 스테이징 안 된 파일 확인 (test-utils 등 인프라 파일)
- [ ] **비동기 이동** — getTranslations(서버) 대신 useTranslations(서버/클라 동기) for SEO

### SPEC 정직성

- [ ] **예시 값 검증** — SPEC 예시는 도메인 테스트로 정본 라이브러리 검증 후 못박기
- [ ] **로케일 포맷** — `useLocale()` → Intl API (로케일 BCP-47), `t()` 키 아님
- [ ] **En 스크린샷** — UI 사람 텍스트가 en 로케일에서도 로케일화됨 확인

---

## 6. 테스트 전략

### 단위 테스트 (Vitest, jsdom)
```typescript
// lib/transparent-background/color-distance.test.ts
describe('euclideanDistance', () => {
  it('returns 0 for identical colors', () => {
    const dist = euclideanDistance({ r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 });
    expect(dist).toBe(0);
  });
  
  it('returns sqrt(3)*255 for max distance', () => {
    const dist = euclideanDistance({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
    expect(dist).toBeCloseTo(Math.sqrt(3) * 255, 0);
  });
});

// lib/transparent-background/transparency.test.ts
describe('applyTransparency', () => {
  it('preserves existing alpha', () => {
    const src = new ImageData(new Uint8ClampedArray([
      255, 0, 0, 128, // red, half transparent
    ]), 1, 1);
    const result = applyTransparency(src, { r: 0, g: 0, b: 0 }, 50, 0, 'global');
    // 검은색 배경이니 제거, alpha 128*0 = 0
    expect(result.data[3]).toBe(0);
  });
  
  it('feathers boundary pixels', () => {
    // tolerance 50, feather 10인 경우 40–50 거리 픽셀 alpha 보간
  });
});
```

**jsdom 캔버스 전략**:
- ImageData 생성 헬퍼로 순수 도메인 테스트
- canvas 렌더는 어댑터/E2E에서만 (실제 브라우저)
- 모의 canvas: `jest.mock()` or 스킵 (E2E로 충분)

### 컴포넌트 테스트
```typescript
// components/tools/transparent-background/__tests__/RemovalControls.test.tsx
describe('RemovalControls', () => {
  it('renders tolerance slider with correct aria labels', () => {
    const onChange = jest.fn();
    render(
      <RemovalControls
        tolerance={50}
        onToleranceChange={onChange}
        feather={2}
        onFeatherChange={() => {}}
        mode="flood-fill"
        onModeChange={() => {}}
      />,
      { wrapper: NextIntlClientProvider } // real messages
    );
    
    const slider = screen.getByLabelText('Tolerance (유사도)');
    expect(slider).toHaveAttribute('aria-valuetext', 'Tolerance: 50%');
  });
});
```

### E2E 시나리오 (Playwright)

```typescript
// tests/e2e/transparent-background-upload.spec.ts
test('scenario 1: upload white-bg image, auto-detect, download', async ({ page }) => {
  // 1. Generate white-bg test image (code-generated PNG)
  const testImage = generateTestImage({ bg: 'white', fg: 'red-square' });
  
  // 2. Upload via drag-drop or file input
  await page.goto('/ko/tools/transparent-background');
  await page.locator('input[type="file"]').setInputFiles(testImage);
  
  // 3. Auto-detect
  await page.locator('button:has-text("자동 감지")').click();
  await expect(page.locator('[role="progressbar"]')).toBeHidden(); // detection done
  
  // 4. Tolerance default 50
  const toleranceSlider = page.locator('input[aria-label="Tolerance"]');
  await expect(toleranceSlider).toHaveValue('50');
  
  // 5. Preview visible with checkerboard
  const previewCanvas = page.locator('canvas').first();
  await expect(previewCanvas).toBeVisible();
  
  // 6. Download
  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("PNG 다운로드")').click();
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toMatch(/^transparent-\d+\.png$/);
});
```

**테스트 이미지 전략**:
- 코드로 생성 (PNG 구조 작성)
  - 흰 배경 + 빨강 사각형
  - 흰 배경 + 검은 텍스트
  - 이미 투명한 이미지
- fixtures 디렉토리 대신 동적 생성 (크기 제어 용이)

---

## 7. 배포 흐름

1. **상태 전환**: registry.ts `status: 'coming_soon'` → `'live'` (코드 완성 후)
2. **정적 빌드**: `pnpm build` → `/ko/tools/transparent-background` 생성 (generateStaticParams)
3. **E2E 게이트**: 전체 E2E 통과, 시각 검증, 콘솔 에러 0
4. **배포**: `git push origin converter/transparent-background:main` → CF 자동 빌드+배포
5. **라이브 검증**: curl `/ko/tools/transparent-background` (200 OK, canonical, JSON-LD 확인)

---

## 8. 파일 크기 제약

| 파일 | 최대 줄 | 정당화 |
|------|--------|--------|
| 도메인 함수 (color-distance 등) | 50줄 | 순수, 명확 |
| transparency.ts (핵심 알고리즘) | 150줄 | 복잡도 허용, 상세 주석 |
| 컴포넌트 (Tsx) | 200줄 | 단일 책임 (업로드/색선택/슬라이더 분리) |
| 훅 (useTransparencyRemover) | 250줄 | 상태 복잡도, 명확한 구조 |
| 라우트/page.tsx | 전체 <500줄 | 이미 큼 (다른 도구 분기들), transparent-background 분기는 <30줄 |

---

## 9. 예상 일정 & 의존성

| 단계 | 담당 | 소요 | 선행 조건 |
|------|------|------|---------|
| 0. 이 청사진 검토 | 팀 전체 | 30min | — |
| 1. domain-engineer TDD | domain-engineer | 2-3시간 | 청사진 명확 |
| 2. ui-engineer 컴포넌트 | ui-engineer | 2-3시간 | 1 완료 |
| 3. platform-engineer 라우트 | platform-engineer | 1시간 | 1, 2 병렬 |
| 4. seo-geo-engineer 콘텐츠 | seo-geo-engineer | 1-2시간 | 1 완료, 병렬 진행 |
| 5. qa-integration E2E | qa-integration | 1-2시간 | 2, 3 완료 |
| 6. 리더 라이브 게이트 | 리더 | 30min | 5 완료 |
| **총 소요** | **5인 병렬** | **~4시간** | — |

---

## 10. 제약 & 가정

1. **외부 라이브러리 없음** — canvas API만, qrcode 라이브러리 미사용 (SPEC CRITICAL)
2. **로컬 처리만** — 백엔드/API 호출 0, 모든 데이터 클라이언트
3. **단색 배경만** — 인물 누끼/복잡 사진은 out-of-scope (SPEC 명시)
4. **SSG 빌드** — generateStaticParams로 ko/en 2개 라우트 생성, 정적 export 대비
5. **CSP 준수** — canvas dataURL (inline), 외부 스크립트 0
6. **i18n 초기값** — 모든 키가 처음부터 ko/en에 등재 (런타임 MISSING_MESSAGE 0)

---

## 11. 위험 신호 & 완화책

| 위험 | 신호 | 완화책 |
|------|------|--------|
| 큰 이미지 블로킹 | 메인스레드 jank | 청크 처리 (65k/rAF), 진행률 표시 |
| 테스트 누락 | domain 테스트만 <80% | platform-engineer가 통합테스트(type-check + build) 검증 |
| i18n 드리프트 | UI가 새 키 지어냄 | platform-engineer/ui-engineer 협업, grep 대조 사전 |
| SEO 게이트링 | Intro/Faq가 mounted 안 | seo-geo가 프리렌더 HTML로 직접 검증 |
| ShareButtons 미배선 | 라우트에 자동 배선 안됨 | platform-engineer/라우트 엔지니어 재확인 (현행 템플릿) |

---

**청사진 작성 완료**: 2026-07-04
**다음 단계**: domain-engineer 청사진 읽고 TDD 착수 → 도메인 계약 확정 → 병렬 팀 착수
