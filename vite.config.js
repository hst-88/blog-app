import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 Vue 相关库打包在一起
          if (id.includes('node_modules/vue') || 
              id.includes('node_modules/pinia') || 
              id.includes('node_modules/vue-router')) {
            return 'vue-vendor'
          }
          // 其他第三方库（如 axios、echarts 等）
          // if (id.includes('node_modules/axios')) {
          //   return 'utils-vendor'
          // }
        }
      }
    }
  }
})