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
  // Vercel과 GitHub Pages 모두 동일한 루트 경로 사용
  // Vercel 배포 환경은 건드리지 않고, GitHub Pages도 동일하게 설정
  base: '/',
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
