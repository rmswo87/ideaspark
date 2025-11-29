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
  // Vercel 배포 후 vercel dev 사용 시 프록시 불필요
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})
