---
# 북마크 주제 템플릿 (Korean/Korean file only — 한국어 파일)
# 필수 필드 (REQUIRED):
#   - title: 주제 제목 (예: "하네스 엔지니어링")
#   - description: 주제 설명 (≤200 글자, 평문)
#   - sections: 섹션 배열 (≥1개)
#
# 선택 필드 (OPTIONAL):
#   - slug: 고유 ID (생략 시 파일명에서 자동 생성, 예: "harness-engineering")
#
# sections 구조:
#   - heading: 섹션 제목 (예: "메타 스킬")
#   - links: 링크 배열 (≥1개, but topic total ≥3 links)
#     - label: 링크 제목 (필수)
#     - url: 유효한 http(s) URL (필수, rel=noopener)
#     - description: 링크 설명 (선택, ≤100 글자)

title: "주제 제목을 여기에 입력하세요"
description: "이 주제에 대한 짧은 설명을 여기에 입력하세요. 최대 200글자입니다."
sections:
  - heading: "첫 번째 섹션"
    links:
      - label: "링크 제목"
        url: "https://example.com"
        description: "선택: 링크에 대한 짧은 설명"
      - label: "두 번째 링크"
        url: "https://example.com/another"
  - heading: "두 번째 섹션"
    links:
      - label: "세 번째 링크"
        url: "https://example.com/third"
        description: "설명"
---

# 주제별 링크 모음

이 섹션은 선택사항입니다. 마크다운 본문은 렌더되지 않고, 위 frontmatter의 링크만 표시됩니다.

## 필수 규칙

- **한국어/영어 쌍 필수**: `<topic>.md` (한국어) + `<topic>_en.md` (영어) 동시 생성
- **필드 정의**: 한국어 파일에서만 정의 (slug, title, description, sections)
- **링크 최소 3개**: 주제당 총 링크 수 ≥3
- **URL 유효성**: 반드시 `http://` 또는 `https://`로 시작
- **설명 길이**: title ≤200자, link description ≤100자 (평문)

## 예시 파일명

- `harness-engineering.md` + `harness-engineering_en.md`
- `frontend-resources.md` + `frontend-resources_en.md`
