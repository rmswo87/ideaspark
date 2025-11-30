# Vercel과 로컬 환경 동기화 확인

## 문제 상황

- ✅ Vercel 배포: 추천 아이디어 섹션이 정상 작동
- ❌ 로컬 환경: 추천 아이디어 섹션이 보이지 않음

## 확인 사항

### 1. 로컬에서 로그인 확인
추천 아이디어는 **로그인한 사용자에게만** 표시됩니다.
- `App.tsx` 358번째 줄: `{user && <RecommendedIdeas ... />}`
- `RecommendedIdeas.tsx` 44번째 줄: `if (!user) return null;`

**해결 방법**: 로컬에서 로그인 후 확인하세요.

### 2. 빌드 캐시 문제
로컬 빌드 캐시가 오래된 버전을 사용할 수 있습니다.

**해결 방법**:
```bash
# 빌드 캐시 클리어
rm -rf node_modules/.vite
rm -rf dist

# 재빌드
npm run dev
```

### 3. 브라우저 캐시 문제
브라우저가 오래된 JavaScript 파일을 캐시하고 있을 수 있습니다.

**해결 방법**:
- Chrome: `Ctrl+Shift+R` (하드 리프레시)
- 또는 개발자 도구 → Network 탭 → "Disable cache" 체크

### 4. 파일 동기화 확인
로컬 파일이 GitHub main 브랜치와 동일한지 확인:

**필수 파일**:
- ✅ `src/App.tsx` - RecommendedIdeas import 및 사용
- ✅ `src/components/RecommendedIdeas.tsx` - 추천 컴포넌트
- ✅ `src/components/IdeaCard.tsx` - recommendationReason prop 지원
- ✅ `src/services/recommendationService.ts` - 추천 서비스

## 로컬 테스트 체크리스트

1. [ ] 로그인 상태 확인 (프로필 버튼이 보이는지)
2. [ ] 브라우저 콘솔에서 에러 확인
3. [ ] Network 탭에서 `getRecommendedIdeas` API 호출 확인
4. [ ] 빌드 캐시 클리어 후 재시작
5. [ ] 하드 리프레시 (Ctrl+Shift+R)

## 디버깅 방법

브라우저 콘솔에서 다음을 확인:

```javascript
// 1. 로그인 상태 확인
console.log('User:', user);

// 2. RecommendedIdeas 컴포넌트 렌더링 확인
// React DevTools에서 RecommendedIdeas 컴포넌트 찾기

// 3. API 호출 확인
// Network 탭에서 "recommended" 또는 "behaviors" 검색
```

