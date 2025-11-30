# Reddit 번역 기능 사용 가이드

## 개요

IdeaSpark는 Reddit의 자체 번역 기능을 활용하여 영어 게시글을 한국어로 번역된 페이지를 보여줍니다.

## 작동 방식

### Reddit 번역 페이지 접근

Reddit은 URL에 `?lang=ko` 파라미터를 추가하면 해당 언어로 번역된 페이지를 제공합니다.

**예시**:
- 원문: `https://www.reddit.com/r/SomebodyMakeThis/comments/abc123/title/`
- 번역: `https://www.reddit.com/r/SomebodyMakeThis/comments/abc123/title/?lang=ko`

### 구현 방법

1. **번역 버튼 클릭**: 아이디어 상세 페이지에서 "번역 보기" 버튼 클릭
2. **iframe 표시**: Reddit 번역 페이지를 iframe으로 표시
3. **원문/번역 토글**: "원문 보기" 버튼으로 원문과 번역을 전환

## 지원 언어

Reddit은 다음 언어를 지원합니다:
- 한국어 (`?lang=ko`)
- 일본어 (`?lang=ja`)
- 중국어 (`?lang=zh`)
- 스페인어 (`?lang=es`)
- 프랑스어 (`?lang=fr`)
- 독일어 (`?lang=de`)
- 기타 다수

## 제한사항

1. **Reddit 의존성**: Reddit의 번역 기능이 작동해야 함
2. **iframe 제한**: 일부 브라우저에서 iframe 표시 제한 가능
3. **번역 품질**: Reddit의 번역 품질에 의존

## 향후 개선 사항

- 번역 품질 피드백 수집
- 자동 언어 감지
- 사용자 언어 설정 저장

