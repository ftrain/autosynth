/**
 * @file vite.config.ts
 * @brief Vite configuration for plugin UI
 *
 * Builds the React UI into a single HTML file that can be
 * embedded into the JUCE plugin.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    // Bundle everything into a single HTML file for embedding
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
    // Inline all assets
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // IMPORTANT: Use IIFE format, not ES modules
        // ES modules use import() which doesn't work with inline scripts
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    // Source maps for debugging
    sourcemap: false,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    // Development server port
    port: 5173,
    // Allow external connections (for plugin development)
    host: true,
  },
  define: {
    // Prevent React DevTools from showing up in production
    __REACT_DEVTOOLS_GLOBAL_HOOK__: JSON.stringify({ isDisabled: true }),
  },
});
