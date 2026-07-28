import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue({ include: [/\.vue$/] }), cesium()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      // 后端 Nest API（包含 /api/auth /api/user 等）
      '/api': {
        changeOrigin: true,
        // 请求转发到本地NestJS后端
        target: 'http://localhost:3010',
        ws: true,
      }
    }
  }
})
