import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: "./src_client",
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src_client', import.meta.url))
    }
  },
  build: {
    outDir: '../build_client',
    emptyOutDir: false
  },
})
