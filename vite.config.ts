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
  // GitHub Pages 배포를 위한 base path 설정
  // 환경 변수로 제어: GitHub Pages일 때만 /ideaspark/ 사용
  // Vercel 배포 시에는 '/' 사용
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
