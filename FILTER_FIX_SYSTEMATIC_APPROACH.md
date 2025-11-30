# 필터링 기능 체계적 수정 접근법

## 현재 상황
- 로그상 필터는 작동함 (50개 → 42개 → 8개)
- setIdeas가 호출되고 있음
- 렌더링도 되고 있음
- 하지만 UI에는 여전히 동일한 결과가 표시됨

## 체계적 검증 체크리스트

### ✅ 완료된 항목
- [x] useCallback 의존성에서 `ideas.length` 제거
- [x] useEffect 의존성을 직접 필터 값으로 변경
- [x] 함수형 상태 업데이트 적용
- [x] renderKey를 통한 강제 리렌더링

### ⚠️ 확인 필요 항목

#### 1. React 배치 업데이트 문제
- [ ] React 18의 자동 배치로 인해 상태 업데이트가 지연되는가?
- [ ] `flushSync`를 사용하여 강제 동기 업데이트가 필요한가?

#### 2. 브라우저 DOM 업데이트 문제
- [ ] React가 리렌더링을 하지만 브라우저가 DOM을 업데이트하지 않는가?
- [ ] 브라우저 개발자 도구에서 실제 DOM이 변경되는지 확인

#### 3. 컴포넌트 메모이제이션 문제
- [ ] IdeaCard가 React.memo로 감싸져 있어서 props가 같으면 리렌더링하지 않는가?
- [ ] formatDate 함수가 매번 새로 생성되어 메모이제이션을 깨뜨리는가?

#### 4. 상태 참조 문제
- [ ] `ideas` 상태가 실제로 변경되었는지 React DevTools에서 확인
- [ ] 클로저로 인해 이전 값을 참조하고 있는가?

#### 5. 중복 호출 문제
- [ ] fetchIdeas가 여러 번 호출되어 마지막 호출이 이전 데이터로 덮어쓰는가?
- [ ] useEffect가 예상보다 자주 트리거되는가?

## 즉시 시도할 해결 방법

### 방법 1: flushSync 사용 (React 18 배치 업데이트 우회)
```typescript
import { flushSync } from 'react-dom';

flushSync(() => {
  setIdeas(newIdeas);
  setRenderKey(prev => prev + 1);
});
```

### 방법 2: formatDate 함수를 useCallback으로 메모이제이션
```typescript
const formatDate = useCallback((dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}, []);
```

### 방법 3: IdeaCard의 key를 더 고유하게 만들기
```typescript
key={`${idea.id}-${renderKey}-${index}-${categoryFilter}-${subredditFilter}`}
```

### 방법 4: 상태 업데이트를 강제로 분리
```typescript
// setIdeas와 setRenderKey를 별도로 호출하지 말고
// 하나의 상태 객체로 관리
const [ideasState, setIdeasState] = useState({ ideas: [], key: 0 });
```

## 다음 단계
1. React DevTools에서 실제 상태 변경 확인
2. 브라우저 개발자 도구에서 DOM 변경 확인
3. flushSync 적용
4. formatDate useCallback 적용
5. key 값 더 고유하게 만들기

