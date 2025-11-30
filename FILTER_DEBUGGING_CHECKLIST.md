# 필터링 기능 디버깅 체크리스트

## 문제 상황
- 로그상 필터는 제대로 작동함 (27개 → 0개로 변경됨)
- `setIdeas`가 호출되고 있음
- 렌더링도 되고 있음
- 하지만 UI에는 여전히 동일한 결과가 표시됨

## 체크리스트

### 1. 상태 업데이트 확인
- [ ] `setIdeas`가 실제로 호출되는가?
- [ ] `ideas` 상태가 실제로 변경되는가?
- [ ] React DevTools에서 `ideas` 상태 변경을 확인할 수 있는가?

### 2. 리렌더링 확인
- [ ] `HomePage` 컴포넌트가 리렌더링되는가?
- [ ] `ideas.map()`이 새로운 데이터로 실행되는가?
- [ ] 각 `IdeaCard`가 새로운 `key`로 렌더링되는가?

### 3. 다른 곳에서 상태 덮어쓰기 확인
- [ ] `handleCollectIdeas`에서 `fetchIdeas()` 호출 시 필터가 무시되는가?
- [ ] 다른 `useEffect`에서 `setIdeas`를 호출하는가?
- [ ] 컴포넌트가 언마운트되고 다시 마운트되는가?

### 4. 브라우저 캐시 확인
- [ ] 하드 리프레시 (Ctrl+Shift+R) 후에도 동일한 문제가 발생하는가?
- [ ] 개발자 도구에서 "Disable cache" 체크 후 테스트
- [ ] 다른 브라우저에서도 동일한 문제가 발생하는가?

### 5. React 배치 업데이트 확인
- [ ] `setIdeas`와 `setLoading`이 동시에 호출되어 배치 처리되는가?
- [ ] `flushSync`를 사용하여 강제 동기 업데이트가 필요한가?

### 6. 실제 데이터 확인
- [ ] `getIdeas`가 실제로 다른 데이터를 반환하는가?
- [ ] Supabase 쿼리가 실제로 필터를 적용하는가?
- [ ] 네트워크 탭에서 API 응답을 확인할 수 있는가?

## 해결 시도 방법

### 방법 1: 상태 업데이트를 함수형으로 변경
```typescript
setIdeas(() => newIdeas);
```

### 방법 2: flushSync 사용
```typescript
import { flushSync } from 'react-dom';
flushSync(() => {
  setIdeas(newIdeas);
});
```

### 방법 3: useReducer 사용
```typescript
const [ideas, dispatch] = useReducer(ideasReducer, []);
dispatch({ type: 'SET_IDEAS', payload: newIdeas });
```

### 방법 4: ref를 사용한 강제 업데이트
```typescript
const forceUpdate = useReducer(() => ({}), {})[1];
```

## 다음 단계
각 체크리스트 항목을 하나씩 확인하고, 문제가 발견되면 해당 항목을 해결한 후 다음 항목으로 진행합니다.

