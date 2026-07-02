# 즐겨찾기 (Bookmarks) 콘텐츠 작성 가이드

## 새 주제 추가 방법

1. `_TEMPLATE.md` + `_TEMPLATE_en.md` 템플릿 확인 및 복사
2. `topics/` 디렉토리에 저장
3. 파일명: 영문 slug로 작성 (예: `harness-engineering.md`)
4. Frontmatter 작성:
   - `title`: 주제 제목 (한국어/영어 구분)
   - `description`: 주제 설명 (≤200자, 평문)
   - `slug`: 선택사항 (생략 시 파일명에서 자동 생성)
   - `sections`: 섹션 배열 (≥1개)

5. `pnpm dev` 또는 `pnpm build` → 자동 검증 후 `bookmarks.generated.json` 생성

## 필수 규칙

### 파일 쌍 (File Pairs)

- **필수**: 모든 주제는 한국어 파일 + 영어 파일 동시 존재
- **파일명**: `<topic>.md` (한국어) + `<topic>_en.md` (영어)
- **예시**: `harness-engineering.md` + `harness-engineering_en.md`

### Frontmatter 필드

```yaml
title: "주제 제목"              # 필수: 주제 이름
description: "설명"            # 필수: ≤200 글자, 평문
slug: "custom-id"              # 선택: 생략 시 파일명에서 자동 생성 (한국어 파일만)
sections:                       # 필수: ≥1개 섹션
  - heading: "섹션 제목"
    links:                      # 필수: ≥1개 링크
      - label: "링크 제목"      # 필수
        url: "https://..."      # 필수: 유효한 http(s) URL
        description: "설명"     # 선택: ≤100 글자
```

### 링크 최소 개수

- **주제당 최소 3개 링크** (모든 섹션 합산)
- 예: 2섹션이면 3개 이상의 링크를 배분
  - 섹션1: 2개
  - 섹션2: 1개 (최소 3개 총합)

### URL 규칙

- 반드시 `http://` 또는 `https://`로 시작
- 모든 URL은 유효성 검증 (빌드 시)
- 유효하지 않은 URL → 빌드 실패

### 텍스트 길이

- `title`: ≤200 글자
- `description`: ≤200 글자
- link `description`: ≤100 글자
- 모두 평문 (마크다운 미지원)

## 로컬 작성 & 테스트

```bash
# 개발 모드 (predev에서 generator 실행)
pnpm dev

# 빌드 모드 (prebuild에서 generator 실행)
pnpm build

# 테스트
pnpm test src/lib/bookmarks
```

## 검증 및 오류

### 검증 실패 원인 (빌드 중단)

1. **파일 쌍 누락**: 한국어 또는 영어 파일 누락
   - 해결: `harness-engineering.md` + `harness-engineering_en.md` 동시 생성

2. **필드 누락**: title, description, sections, links 중 누락
   - 해결: Frontmatter 재확인

3. **링크 부족**: 주제당 <3 총 링크
   - 해결: 링크 3개 이상 추가

4. **URL 무효**: http(s) 아님, 형식 오류
   - 해결: URL 유효성 재확인

5. **중복 slug**: 같은 slug를 가진 주제 2개 이상
   - 해결: 한 주제의 slug 변경 또는 파일명 변경

6. **텍스트 길이**: 제한 초과
   - 해결: 글자 수 단축

### 빌드 오류 메시지 예시

```
content/bookmarks/topics/test.md: KO has 2 links, need ≥3
content/bookmarks/topics/other.md: EN parse error — description required
Duplicate slug: "harness-engineering"
```

각 오류를 파일명 + 필드 + 원인으로 기록하므로 쉽게 찾아 수정 가능합니다.

## 예시: 완성된 주제

**파일**: `harness-engineering.md` (한국어)

```yaml
---
title: "하네스 엔지니어링"
description: "소프트웨어 엔지니어링의 기초를 다루는 신뢰할 수 있는 자료"
sections:
  - heading: "메타 스킬"
    links:
      - label: "TDD"
        url: "https://martinfowler.com/..."
        description: "테스트 우선 개발"
      - label: "Clean Architecture"
        url: "https://blog.cleancoder.com/..."
  - heading: "기법"
    links:
      - label: "Refactoring"
        url: "https://refactoring.guru/"
---
```

**파일**: `harness-engineering_en.md` (영어)

```yaml
---
title: "Harness Engineering"
description: "Trusted resources for software engineering fundamentals"
sections:
  - heading: "Meta Skills"
    links:
      - label: "TDD"
        url: "https://martinfowler.com/..."
        description: "Test-driven development"
      - label: "Clean Architecture"
        url: "https://blog.cleancoder.com/..."
  - heading: "Techniques"
    links:
      - label: "Refactoring"
        url: "https://refactoring.guru/"
---
```

## 주제 삭제

한 주제를 완전히 제거하려면:

1. `topics/` 폴더에서 `<topic>.md` + `<topic>_en.md` 동시 삭제
2. `pnpm dev` 또는 `pnpm build` → 자동으로 catalog 갱신

## 자주 묻는 질문 (FAQ)

### Q: 마크다운을 description에 쓸 수 있나요?

A: **아니요**. 모든 텍스트 필드는 평문입니다. 마크다운은 지원되지 않습니다.

### Q: 영어 파일에서만 slug를 쓸 수 있나요?

A: **아니요**. Slug는 한국어 파일에서만 정의하고, 영어는 상속받습니다.

### Q: 이미지나 임베드를 링크에 추가할 수 있나요?

A: **현재 아니요**. Title + URL + 선택적 description만 가능합니다.

### Q: 한 주제를 여러 카테고리에 배치할 수 있나요?

A: **아니요**. 각 주제는 하나의 파일 쌍으로 관리되며, 다중 카테고리 미지원.

## 생성된 결과물

`pnpm build` 후:

```
src/components/tools/bookmarks/data/bookmarks.generated.json
```

이 파일은 **자동 생성**이며, 직접 수정하지 않습니다. 콘텐츠 수정 시 항상 `content/bookmarks/topics/*.md` 파일을 수정하세요.
