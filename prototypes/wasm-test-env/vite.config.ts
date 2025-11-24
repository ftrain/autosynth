import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Required for SharedArrayBuffer (AudioWorklet)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['*.wasm'], // Exclude WASM from optimization
  },
  assetsInclude: ['**/*.wasm'], // Include WASM files as assets
})
