/**
 * @file vite.config.ts
 * @brief Vite configuration for Phoneme UI
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  define: {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: JSON.stringify({ isDisabled: true }),
  },
});
