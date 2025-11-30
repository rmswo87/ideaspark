# Mermaid를 React에서 안전하게 렌더링하는 가이드

## 문제 상황

React 애플리케이션에서 Mermaid 다이어그램을 렌더링할 때 다음과 같은 에러가 발생했습니다:

```
NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
```

## 실패 원인 분석

### 1. **React의 가상 DOM vs Mermaid의 직접 DOM 조작**

- **React**: 가상 DOM을 통해 DOM을 추상화하고, 변경사항을 배치(batch)하여 효율적으로 업데이트
- **Mermaid**: SVG를 생성하기 위해 직접 DOM을 조작 (`removeChild`, `insertBefore`, `appendChild` 등 사용)
- **충돌**: React가 DOM을 관리하는 동안 Mermaid가 같은 DOM을 직접 조작하려고 하면 충돌 발생

### 2. **시도했던 해결 방법들과 실패 이유**

#### ❌ 방법 1: `useEffect`와 `setTimeout` 사용
```typescript
useEffect(() => {
  setTimeout(() => {
    mermaid.render(id, chart).then(({ svg }) => {
      containerRef.current.innerHTML = svg;
    });
  }, 500);
}, [chart]);
```
**실패 이유**: React의 렌더링 사이클과 타이밍이 맞지 않아 여전히 충돌 발생

#### ❌ 방법 2: `useLayoutEffect` 사용
```typescript
useLayoutEffect(() => {
  // DOM이 준비된 후 렌더링
}, [chart]);
```
**실패 이유**: React의 가상 DOM과 실제 DOM 간의 동기화 문제가 여전히 존재

#### ❌ 방법 3: `dangerouslySetInnerHTML` 사용
```typescript
<div dangerouslySetInnerHTML={{ __html: svgContent }} />
```
**실패 이유**: React가 여전히 해당 요소를 추적하고 있어 Mermaid의 DOM 조작과 충돌

#### ❌ 방법 4: `requestAnimationFrame` 사용
```typescript
requestAnimationFrame(() => {
  containerRef.current.innerHTML = svg;
});
```
**실패 이유**: React의 렌더링 사이클과 완전히 분리되지 않음

### 3. **근본 원인**

React와 Mermaid가 **같은 DOM 트리를 공유**하고 있어서 발생하는 문제입니다. React는 자신이 관리하는 DOM에 대해 완전한 제어권을 가정하지만, Mermaid는 이를 모르고 직접 조작하려고 합니다.

## 최종 해결 방법: iframe 사용

### ✅ 성공한 방법: iframe으로 완전 분리

iframe을 사용하면 React와 Mermaid가 **완전히 분리된 DOM 환경**에서 동작하므로 충돌이 발생하지 않습니다.

```typescript
function MermaidDiagram({ chart, index }: { chart: string; index: number }) {
  const iframeContent = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    svg { width: 100% !important; height: auto !important; }
  </style>
</head>
<body>
  <div class="mermaid">${chart}</div>
  <script>
    mermaid.initialize({ startOnLoad: true });
    mermaid.run();
  </script>
</body>
</html>`;
  }, [chart]);

  return (
    <iframe
      srcDoc={iframeContent}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', minHeight: '400px' }}
    />
  );
}
```

### 왜 iframe이 효과적인가?

1. **완전한 DOM 분리**: iframe 내부는 독립적인 문서 환경
2. **React의 제어 밖**: React는 iframe 요소만 관리, 내부 DOM은 건드리지 않음
3. **Mermaid의 자유로운 DOM 조작**: iframe 내부에서 Mermaid가 원하는 대로 DOM 조작 가능
4. **보안**: `sandbox` 속성으로 안전하게 스크립트 실행

## 구현 단계별 가이드

### 1단계: iframe HTML 생성

```typescript
const iframeContent = useMemo(() => {
  // Mermaid 코드 이스케이프
  const escapedChart = chart
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  
  return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; }
    svg { width: 100% !important; height: auto !important; }
  </style>
</head>
<body>
  <div class="mermaid">${escapedChart}</div>
  <script>
    mermaid.initialize({ startOnLoad: true });
    mermaid.run();
  </script>
</body>
</html>`;
}, [chart]);
```

### 2단계: iframe 렌더링

```typescript
<iframe
  srcDoc={iframeContent}
  sandbox="allow-scripts allow-same-origin"
  style={{ width: '100%', minHeight: '400px' }}
  scrolling="no"
/>
```

### 3단계: 에러 처리 (선택사항)

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'mermaid-rendered') {
      if (!event.data.success) {
        setError(event.data.error);
      }
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## 핵심 교훈

### ✅ 성공 요인

1. **완전한 분리**: React와 Mermaid가 서로 다른 DOM 환경에서 동작
2. **간단한 구현**: 복잡한 타이밍 조정이나 상태 관리 불필요
3. **안정성**: React의 렌더링 사이클과 무관하게 동작

### ❌ 실패 요인

1. **같은 DOM 공유**: React와 Mermaid가 같은 DOM 트리를 공유
2. **타이밍 의존성**: `setTimeout`, `requestAnimationFrame` 등은 근본 해결책이 아님
3. **React의 제어**: React가 관리하는 DOM에 직접 조작 시도

## 다른 해결 방법들 (참고)

### 방법 A: react-mermaid2 라이브러리 사용
```bash
npm install react-mermaid2
```
- React 전용 래퍼 라이브러리
- 내부적으로 iframe이나 Portal을 사용할 가능성

### 방법 B: React Portal 사용
```typescript
import { createPortal } from 'react-dom';

const portalRoot = document.createElement('div');
document.body.appendChild(portalRoot);

return createPortal(
  <div ref={containerRef} />,
  portalRoot
);
```
- React의 제어 밖에서 렌더링
- iframe보다는 덜 격리됨

### 방법 C: 서버 사이드 렌더링
- Mermaid를 서버에서 SVG로 변환
- 클라이언트에서는 SVG만 표시
- 가장 안전하지만 서버 리소스 필요

## 권장 사항

**프로덕션 환경에서는 iframe 방식을 권장합니다:**

1. ✅ 완전한 DOM 분리로 충돌 없음
2. ✅ 구현이 간단하고 유지보수 용이
3. ✅ React 버전 업데이트에 영향 없음
4. ✅ 다른 서드파티 라이브러리와도 충돌 없음

## 참고 자료

- [LangGraph 시각화 가이드](https://rudaks.tistory.com/entry/langgraph-%EA%B7%B8%EB%9E%98%ED%94%84%EB%A5%BC-%EC%8B%9C%EA%B0%81%ED%99%94%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95)
- [Mermaid 공식 문서](https://mermaid.js.org/)
- [React Portal 문서](https://react.dev/reference/react-dom/createPortal)

