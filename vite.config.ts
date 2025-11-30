import * as path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vercel과 GitHub Pages 배포 환경 구분
  // Vercel: 루트 경로 (/) - 프로덕션 환경
  // GitHub Pages: /ideaspark/ - 테스트/이중화 환경
  // 두 환경 모두 동일한 코드베이스 사용, 환경 변수로 구분
  base: process.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark/' : '/',
  // Vercel 서버리스 함수(api 폴더)는 빌드에서 제외
  build: {
    rollupOptions: {
      external: (id) => {
        // api 폴더의 파일들은 Vercel 서버리스 함수이므로 빌드에서 제외
        if (id.includes('/api/') || id.includes('\\api\\')) {
          return true;
        }
        return false;
      },
    },
  },
  // 개발 서버에서도 api 폴더 제외
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접속 허용 (모바일 접속 가능)
    port: 5173,
    strictPort: false, // 포트가 사용 중이면 다른 포트 자동 선택
    fs: {
      deny: ['**/api/**'],
    },
  },
  // 로그 레벨 조정 (불필요한 HMR 로그 억제)
  logLevel: 'warn',
})
