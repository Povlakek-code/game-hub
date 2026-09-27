import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目页需要 base=/<repo>/，Cloudflare / 自定义域名需要 base=./
// 用相对路径 ./ 两边都能跑；如需固定可用环境变量 GITHUB_PAGES=1 覆盖。
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/game-hub/' : './',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
