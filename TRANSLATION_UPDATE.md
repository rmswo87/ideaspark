# 번역 기능 업데이트 요약

## 변경 사항

### 이전 방식 (제거됨)
- AI 기반 번역 서비스 (`src/services/translation.ts`)
- OpenRouter를 통한 텍스트 번역
- 번역된 텍스트를 직접 표시

### 새로운 방식 (적용됨)
- **Reddit 자체 번역 기능 활용**
- Reddit URL에 `?lang=ko` 파라미터 추가하여 번역된 페이지 접근
- iframe으로 Reddit 번역 페이지 표시
- 원문/번역 페이지 토글 기능

## 구현 내용

### 1. 번역 페이지 URL 생성
```typescript
function getTranslatedUrl(originalUrl: string): string {
  const url = new URL(originalUrl);
  url.searchParams.set('lang', 'ko');
  return url.toString();
}
```

### 2. UI 변경
- "번역 보기" 버튼: Reddit 번역 페이지를 iframe으로 표시
- "원문 보기" 버튼: 원문 텍스트로 전환
- 외부 링크: 번역/원문 페이지를 새 탭에서 열기

### 3. 제거된 파일
- `src/services/translation.ts` (AI 번역 서비스)
- `TRANSLATION_FEATURE.md` (이전 계획 문서)
- `TRANSLATION_SUMMARY.md` (이전 요약 문서)

### 4. 추가된 문서
- `REDDIT_TRANSLATION.md`: Reddit 번역 기능 사용 가이드

## 사용 방법

1. 아이디어 상세 페이지에서 "번역 보기" 버튼 클릭
2. Reddit 번역 페이지가 iframe으로 표시됨
3. "원문 보기" 버튼으로 원문 텍스트로 전환 가능
4. 외부 링크로 Reddit 페이지를 새 탭에서 열기 가능

## 장점

- **Reddit의 고품질 번역 활용**: Reddit 자체 번역 엔진 사용
- **간단한 구현**: 별도 AI 번역 서비스 불필요
- **실시간 번역**: Reddit에서 최신 번역 제공
- **비용 절감**: AI API 호출 불필요

## 제한사항

- Reddit의 번역 기능이 작동해야 함
- 일부 브라우저에서 iframe 표시 제한 가능
- 번역 품질은 Reddit에 의존

---

**업데이트 일자**: 2025년 11월 26일

