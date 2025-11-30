import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode는 개발 환경에서 컴포넌트를 두 번 렌더링하여 부작용을 찾아내지만,
// 이것이 removeChild 에러의 원인이 될 수 있으므로 제거합니다.
// 프로덕션에서는 StrictMode가 자동으로 비활성화되지만, 개발 환경에서도 제거하여 일관성을 유지합니다.
createRoot(document.getElementById('root')!).render(
  <App />
)
